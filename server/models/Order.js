import mongoose from 'mongoose';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { PAYMENT_STATUS } from '../constants/paymentStatus.js';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
    customerEmail: { type: String, required: [true, 'Customer email is required'], trim: true, lowercase: true },
    customerPhone: { type: String, required: [true, 'Customer phone number is required'], trim: true },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    orderItems: [orderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['COD', 'RAZORPAY'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING_PAYMENT,
    },

    // Customer cancellation request sub-document.
    // Populated when customer calls POST /api/orders/:id/cancel-request.
    // One request per order — submitting again is blocked if status is 'Pending' or 'Approved'.
    // Admin resolves it via /api/admin/cancel-requests/:id/approve or /reject.
    cancellationRequest: {
      requestedAt: { type: Date },
      reason: { type: String, trim: true },
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
      },
      adminNote: { type: String, trim: true, default: null },  // Optional rejection note from admin
      resolvedAt: { type: Date },
    },

    razorpayOrderId: { type: String, default: null, sparse: true },
    razorpayPaymentId: { type: String, default: null, sparse: true },
    failureReason: { type: String, default: null, select: false },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    // Set when Razorpay fires refund.processed webhook — confirms refund actually landed.
    // null until confirmed. Used to send "refund confirmed" email and for admin records.
    refundedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null }
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Compound index: covers getMyOrders (user filter + createdAt sort in one step).
// Also covers getOrdersByUser in adminController since it has the same query shape.
// Replaces the two separate single-field indexes { user: 1 } and { createdAt: -1 }
// for those query paths — MongoDB will prefer this compound index over either alone.
orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Index for admin cancel-requests listing — filters by cancellationRequest.status
orderSchema.index({ 'cancellationRequest.status': 1 });

// TTL index on expiresAt — MongoDB auto-deletes documents when this timestamp is reached.
// expireAfterSeconds: 0 means "delete at exactly the expiresAt time".
// Cleans up abandoned Razorpay draft orders without any cron job.
// WARNING: Do NOT remove this index. Without it, unpaid drafts accumulate forever.
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Order', orderSchema);
