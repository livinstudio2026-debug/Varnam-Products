import mongoose from 'mongoose';

/**
 * Cart model — persists the cart for logged-in users in MongoDB.
 *
 * Design decisions:
 *  - One cart document per user (enforced by unique index on `user`).
 *  - `updatedAt` (from timestamps) drives the abandoned-cart cron — no extra field needed.
 *  - `reminderSentAt` tracks which reminder tier was last sent so the cron
 *    doesn't resend the same email on every run.
 *  - `reminderStage` mirrors the tier: null | '24h' | '3d'
 *    Once a stage is set it only advances, never goes backwards.
 *  - The cart is cleared (items: [], reminderStage: null, reminderSentAt: null)
 *    when the user places an order (call Cart.clearCart from the order flow).
 */

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name:     { type: String, required: true },
    price:    { type: Number, required: true },
    image:    { type: String, default: null },   // thumbnail URL for email
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  },
  { _id: false }  // sub-docs don't need their own _id
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,   // one cart per user
    },
    items: [cartItemSchema],

    // ── Abandoned-cart reminder tracking ─────────────────────────────────
    // null  → no reminder sent yet
    // '24h' → first reminder sent
    // '3d'  → second (final) reminder sent
    reminderStage: {
      type: String,
      enum: [null, '24h', '3d'],
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    // ─────────────────────────────────────────────────────────────────────
  },
  {
    timestamps: true,   // createdAt + updatedAt; updatedAt is used by the cron
  }
);

// Fast lookup by user (already unique, but an explicit index makes intent clear)
cartSchema.index({ user: 1 });

// Cron query: find carts not updated in >X hours with items and stage below target
cartSchema.index({ updatedAt: 1, reminderStage: 1 });

/**
 * Upserts the full cart for a user.
 * Pass the entire items array from the frontend after every mutation.
 *
 * Resets reminder tracking whenever the cart is actively touched —
 * if the user comes back and changes their cart we restart the reminder clock.
 */
cartSchema.statics.syncCart = async function (userId, items) {
  return this.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        items,
        // Reset reminder state so the clock restarts from the latest update
        reminderStage: null,
        reminderSentAt: null,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
};

/**
 * Clears the cart after a successful order.
 * Called from orderController / paymentController after order confirmation.
 */
cartSchema.statics.clearCart = async function (userId) {
  return this.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        items: [],
        reminderStage: null,
        reminderSentAt: null,
      },
    },
    { new: true }
  );
};

export default mongoose.model('Cart', cartSchema);
