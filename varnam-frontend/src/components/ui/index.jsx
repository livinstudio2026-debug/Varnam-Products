const STATUS_VARIANT = {
  Ordered:   'blue',
  Packed:    'amber',
  Shipped:   'amber',
  Delivered: 'green',
  Cancelled: 'red',
  Failed:    'red',
}

const VARIANT_CLASSES = {
  green: 'bg-green-100  text-green-800',
  amber: 'bg-amber-100  text-amber-800',
  blue:  'bg-blue-100   text-blue-800',
  red:   'bg-red-100    text-red-700',
  gray:  'bg-neutral-100 text-neutral-600',
}

/**
 * @param {'green'|'amber'|'blue'|'red'|'gray'} variant  — explicit colour
 * @param {string} status  — order status string (auto-maps to colour if provided)
 */
export function Badge({ children, variant, status, className = '' }) {
  const resolvedVariant =
    variant ?? STATUS_VARIANT[status] ?? 'gray'
  return (
    <span
      className={`badge ${VARIANT_CLASSES[resolvedVariant] ?? VARIANT_CLASSES.gray} ${className}`}
    >
      {children ?? status}
    </span>
  )
}


// ── Spinner ───────────────────────────────────────────────────────────────────
// Accessible loading spinner.
//
// size: 'sm' (16px) | 'md' (24px, default) | 'lg' (40px)
// color: any Tailwind border-color class, default brand-green

export function Spinner({ size = 'md', className = '', label = 'Loading…' }) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size] ?? 'w-6 h-6'
  return (
    <span role="status" aria-label={label} className={`inline-block ${className}`}>
      <span
        className={`block rounded-full border-2 border-brand-green border-t-transparent animate-spin ${sizeClass}`}
      />
    </span>
  )
}

// Full-page spinner centered in its container
export function PageSpinner() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}


// ── EmptyState ────────────────────────────────────────────────────────────────
// Centred empty-state block with icon, heading, message, and optional CTA.
//
// Built-in presets via the `preset` prop:
//   'cart' | 'orders' | 'search' | 'products' | 'generic'
// Or pass your own icon/title/message/action.

const PRESETS = {
  cart: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    title:   'Your cart is empty',
    message: "Looks like you haven't added anything yet.",
  },
  orders: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title:   'No orders yet',
    message: 'Your order history will appear here.',
  },
  search: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title:   'No results found',
    message: 'Try different keywords or browse our categories.',
  },
  products: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    title:   'No products found',
    message: 'Try adjusting your filters.',
  },
  generic: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title:   'Nothing here',
    message: 'Check back later.',
  },
}

/**
 * @param {'cart'|'orders'|'search'|'products'|'generic'} preset
 * @param {ReactNode} icon     — override icon
 * @param {string}    title    — override title
 * @param {string}    message  — override message
 * @param {ReactNode} action   — CTA button/link rendered below message
 */
export function EmptyState({
  preset = 'generic',
  icon,
  title,
  message,
  action,
  className = '',
}) {
  const p = PRESETS[preset] ?? PRESETS.generic
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}>
      <span className="text-neutral-300 mb-5">{icon ?? p.icon}</span>
      <h3 className="font-heading text-xl text-neutral-700 mb-2">
        {title ?? p.title}
      </h3>
      <p className="font-body text-sm text-neutral-400 max-w-xs">
        {message ?? p.message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}


// ── Skeleton loaders ──────────────────────────────────────────────────────────
// Use these while data is loading to prevent layout shift.

function SkeletonBox({ className = '' }) {
  return (
    <div
      className={`bg-neutral-200 rounded-xl animate-pulse ${className}`}
      aria-hidden="true"
    />
  )
}

// Single product card skeleton — matches ProductCard dimensions
export function SkeletonCard() {
  return (
    <div className="card p-0 overflow-hidden" aria-hidden="true">
      <SkeletonBox className="w-full aspect-square rounded-none rounded-t-2xl" />
      <div className="p-4 space-y-2.5">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <SkeletonBox className="h-5 w-16" />
          <SkeletonBox className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Grid of skeleton cards for the shop/homepage loading state
export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Generic text skeleton lines
export function SkeletonText({ lines = 3, className = '' }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5']
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`h-3.5 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  )
}
