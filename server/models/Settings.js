import mongoose from 'mongoose';

// Single-document collection — there is always exactly one Settings document.
// All business logic values that were previously hardcoded in controllers live here.
// Admin can update them via the API without a code deploy.
const settingsSchema = new mongoose.Schema(
  {
    // Shipping
    freeShippingThreshold: {
      type: Number,
      required: true,
      min: [0, 'Free shipping threshold cannot be negative'],
      default: 499,
    },
    flatShippingFee: {
      type: Number,
      required: true,
      min: [0, 'Shipping fee cannot be negative'],
      default: 60,
    },

    // COD
    codLimit: {
      type: Number,
      required: true,
      min: [0, 'COD limit cannot be negative'],
      default: 2000,
    },
    codEnabled: {
      type: Boolean,
      default: true,
    },

    // Store info (useful for email footers and admin panel)
    storeName: {
      type: String,
      default: 'Varnam Organic',
      trim: true,
    },
    storeEmail: {
      type: String,
      default: '',
      trim: true,
    },
    storePhone: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Settings', settingsSchema);
