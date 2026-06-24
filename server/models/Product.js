import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [160, 'Short description cannot exceed 160 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          // 1. If discountPrice is 0, it means there's no active discount.
          if (value === 0) return true;

          // 2. Resolve base price across both Document creation and Query update contexts
          let basePrice = this.price;

          if (!basePrice && typeof this.getUpdate === 'function') {
            const updatePayload = this.getUpdate();
            basePrice = updatePayload.price || (updatePayload.$set && updatePayload.$set.price);
          }

          // 3. Enforce the validation rule if a base price context is discovered
          if (basePrice !== undefined) {
            return value < basePrice;
          }

          return true;
        },
        message: 'Discount price ({VALUE}) must be lower than the base price',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
    },
    stock: {
      type: Number,
      required: [true, 'Inventory stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compounded index for lightning-fast catalog search queries
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });

export default mongoose.model('Product', productSchema);