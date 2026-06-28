import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { settingsAPI, cartAPI } from '../services/api'

function effectivePrice(product) {
  return product.discountPrice > 0 ? product.discountPrice : product.price
}

function computeTotals(items, freeShippingThreshold, flatShippingFee) {
  const subtotal = items.reduce(
    (sum, { product, quantity }) => sum + effectivePrice(product) * quantity,
    0
  )

  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold
  const shippingFee = subtotal === 0 ? 0 : qualifiesForFreeShipping ? 0 : flatShippingFee
  const grandTotal = subtotal + shippingFee

  const amountForFreeShipping = qualifiesForFreeShipping
    ? 0
    : freeShippingThreshold - subtotal

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  )

  return { subtotal, shippingFee, grandTotal, amountForFreeShipping, freeShippingProgress }
}

/**
 * Converts the Zustand cart items (which store the full product object)
 * into the flat shape the server Cart model expects:
 *   { product: id, name, price, image, quantity }
 *
 * Uses effectivePrice so the persisted price always reflects the actual
 * charged amount (discountPrice when set, otherwise price).
 */
function toServerItems(items) {
  return items.map(({ product, quantity }) => ({
    product:  product._id,
    name:     product.name,
    price:    effectivePrice(product),
    image:    product.images?.[0] ?? null,
    quantity,
  }))
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      freeShippingThreshold: 499,
      flatShippingFee:       60,
      codLimit:              2000,
      codEnabled:            true,

      settingsFetched: false,

      fetchSettings: async () => {
        try {
          const { data } = await settingsAPI.getPublic()
          const { freeShippingThreshold, flatShippingFee, codLimit, codEnabled } = data.data
          set({
            freeShippingThreshold,
            flatShippingFee,
            codLimit,
            codEnabled,
            settingsFetched: true,
          })
        } catch {
          // silently ignore — defaults remain
        }
      },

      /**
       * Persists the current items array to MongoDB.
       * Only fires when the user is authenticated (checked via
       * useAuthStore inside authStore, but we receive `isAuthenticated`
       * as a parameter to avoid a circular import).
       *
       * Pass `overrideItems` when you need to sync a known-new items
       * array before Zustand's set() has propagated (e.g. in addItem).
       */
      _syncToDB: async (isAuthenticated, overrideItems) => {
        if (!isAuthenticated) return
        try {
          const items = overrideItems ?? get().items
          await cartAPI.sync(toServerItems(items))
        } catch {
          // Network errors are silently swallowed — localStorage remains
          // the source of truth for the current session.
        }
      },

      /**
       * Called by authStore after a successful login or session restore.
       *
       * Merge strategy (guest-adds-then-logs-in safe):
       *
       *   1. Snapshot local items BEFORE the API call (the guest's pre-login cart).
       *   2. Fetch the server cart.
       *   3. Merge:
       *        - Start with all local items (they carry the full product object
       *          needed for the UI — server items are flat and lack stock, slug, etc.)
       *        - For each server item whose product ID is NOT already in local,
       *          skip it — we can't reconstruct the product object from the flat
       *          server shape, and showing a half-hydrated item would break the UI.
       *        - For each server item whose product ID IS in local, take the
       *          HIGHER quantity (preserves the guest's intent while not discarding
       *          the saved quantity from a previous session).
       *   4. Persist the merged result back to the server immediately.
       *
       * Result: a guest who added items before logging in never loses them.
       * Items saved from a previous logged-in session that are also in the
       * current local cart get their quantities bumped to the higher value.
       * Server-only items (from a previous session, not currently in local)
       * are intentionally skipped — we cannot render them without a full
       * product object, and the user can re-add them from the shop.
       */
      hydrateFromDB: async () => {
        try {
          const { data } = await cartAPI.get()
          const serverItems = data.items ?? []
          const localItems  = get().items  // snapshot before any set()

          // Index local items by product ID for O(1) lookup
          const localById = {}
          for (const li of localItems) {
            localById[li.product._id] = li
          }

          // Start with local items, bumping quantity where server had more
          const mergedItems = localItems.map((localItem) => {
            const si = serverItems.find((s) => s.product === localItem.product._id)
            if (!si) return localItem
            const mergedQty = Math.max(localItem.quantity, si.quantity)
            const cappedQty = Math.min(mergedQty, localItem.product.stock ?? mergedQty)
            return cappedQty !== localItem.quantity
              ? { ...localItem, quantity: cappedQty }
              : localItem
          })

          // Bring in server-only items (saved from a previous session).
          // Reconstruct a minimal product object from the flat server shape —
          // enough for the cart UI to render name, price, image, and quantity.
          // Fields the server doesn't return (stock, slug, discountPrice, etc.)
          // are given safe defaults so nothing in the UI breaks.
          for (const si of serverItems) {
            if (localById[si.product]) continue  // already handled above
            mergedItems.push({
              product: {
                _id:           si.product,
                name:          si.name,
                price:         si.price,
                discountPrice: 0,          // flat server price is already effective
                images:        si.image ? [si.image] : [],
                stock:         999,        // unknown — allow editing; server validates at checkout
                slug:          '',         // no slug from server; product link won't work but cart renders
                active:        true,
              },
              quantity: si.quantity,
            })
          }

          const changed =
            mergedItems.length !== localItems.length ||
            mergedItems.some((item, i) => item.quantity !== localItems[i]?.quantity)

          if (changed) {
            set({ items: mergedItems })
          }

          // Always push merged state to server so abandoned-cart cron stays in sync
          const itemsToSync = changed ? mergedItems : localItems
          if (itemsToSync.length > 0) {
            await cartAPI.sync(toServerItems(itemsToSync))
          }
        } catch {
          // Silently ignore — localStorage cart remains usable offline
        }
      },

      addItem: (product, quantity = 1) => {
        const { items, _syncToDB } = get()
        const existingIndex = items.findIndex((item) => item.product._id === product._id)

        let updatedItems
        if (existingIndex !== -1) {
          updatedItems = items.map((item, index) => {
            if (index !== existingIndex) return item
            const newQty = Math.min(item.quantity + quantity, product.stock)
            return { ...item, quantity: newQty }
          })
        } else {
          const safeQty = Math.min(quantity, product.stock)
          updatedItems = [...items, { product, quantity: safeQty }]
        }

        set({ items: updatedItems })
        // Pass updatedItems directly — set() is synchronous but we want
        // to sync the new state, not what get() would return mid-closure.
        _syncToDB(get()._isAuthenticated, updatedItems)
      },

      removeItem: (productId) => {
        const { _syncToDB } = get()
        const updatedItems = get().items.filter((item) => item.product._id !== productId)
        set({ items: updatedItems })
        _syncToDB(get()._isAuthenticated, updatedItems)
      },

      updateQty: (productId, qty) => {
        const { _syncToDB } = get()
        if (qty <= 0) {
          get().removeItem(productId)
          return
        }
        const updatedItems = get().items.map((item) =>
          item.product._id === productId
            ? { ...item, quantity: Math.min(qty, item.product.stock) }
            : item
        )
        set({ items: updatedItems })
        _syncToDB(get()._isAuthenticated, updatedItems)
      },

      clearCart: (isAuthenticated) => {
        set({ items: [] })
        if (isAuthenticated ?? get()._isAuthenticated) {
          cartAPI.clear().catch(() => {})
        }
      },

      // ── Auth state mirror ────────────────────────────────────────────────
      // authStore sets this after login/logout so cartStore can gate DB calls
      // without importing authStore (which would create a circular dependency).
      _isAuthenticated: false,
      _setAuthState: (isAuthenticated) => set({ _isAuthenticated: isAuthenticated }),

      // ── Selectors ────────────────────────────────────────────────────────
      itemCount: () =>
        get().items.reduce((sum, { quantity }) => sum + quantity, 0),

      isInCart: (productId) =>
        get().items.some((item) => item.product._id === productId),

      getItemQty: (productId) => {
        const item = get().items.find((i) => i.product._id === productId)
        return item ? item.quantity : 0
      },

      totals: () => {
        const { items, freeShippingThreshold, flatShippingFee } = get()
        return computeTotals(items, freeShippingThreshold, flatShippingFee)
      },

      subtotal:             () => get().totals().subtotal,
      shippingFee:          () => get().totals().shippingFee,
      grandTotal:           () => get().totals().grandTotal,
      amountForFreeShipping: () => get().totals().amountForFreeShipping,
      freeShippingProgress:  () => get().totals().freeShippingProgress,
    }),

    {
      name:    'varnam-cart',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        items:                 state.items,
        freeShippingThreshold: state.freeShippingThreshold,
        flatShippingFee:       state.flatShippingFee,
        codLimit:              state.codLimit,
        codEnabled:            state.codEnabled,
        settingsFetched:       state.settingsFetched,
        // _isAuthenticated intentionally excluded — re-derived from authStore on mount
      }),
    }
  )
)