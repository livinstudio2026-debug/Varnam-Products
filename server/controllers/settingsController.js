import Settings from '../models/Settings.js';

// Helper used by orderController and paymentController to fetch settings.
// Returns the single Settings document, creating it with defaults if it doesn't exist yet.
// This is the only place in the codebase that knows how settings are stored.
export const getSettingsDocument = async () => {
  let settings = await Settings.findOne().lean();
  if (!settings) {
    // First boot — create the default settings document
    const created = await Settings.create({});
    settings = created.toObject();
  }
  return settings;
};

// @desc    Get public storefront settings — shipping params + COD availability
// @route   GET /api/settings
// @access  Public
// NOTE: Only exposes fields the checkout UI needs. Admin-only fields
//       (storeName, storeEmail, storePhone, timestamps) are excluded.
export const getPublicSettings = async (req, res) => {
  try {
    const settings = await getSettingsDocument();
    return res.status(200).json({
      success: true,
      data: {
        freeShippingThreshold: settings.freeShippingThreshold,
        flatShippingFee:       settings.flatShippingFee,
        codLimit:              settings.codLimit,
        codEnabled:            settings.codEnabled,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    Get full settings document (Admin)
// @route   GET /api/settings/admin
// @access  Protected (Admin)
export const getSettings = async (req, res) => {
  try {
    const settings = await getSettingsDocument();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Protected (Admin)
export const updateSettings = async (req, res) => {
  try {
    const {
      freeShippingThreshold,
      flatShippingFee,
      codLimit,
      codEnabled,
      storeName,
      storeEmail,
      storePhone,
    } = req.body;

    // Build update object with only the fields that were actually sent
    const updates = {};
    if (freeShippingThreshold !== undefined) updates.freeShippingThreshold = Number(freeShippingThreshold);
    if (flatShippingFee !== undefined)       updates.flatShippingFee       = Number(flatShippingFee);
    if (codLimit !== undefined)              updates.codLimit              = Number(codLimit);
    if (codEnabled !== undefined)            updates.codEnabled            = Boolean(codEnabled);
    if (storeName !== undefined)             updates.storeName             = storeName;
    if (storeEmail !== undefined)            updates.storeEmail            = storeEmail;
    if (storePhone !== undefined)            updates.storePhone            = storePhone;

    // Validate each numeric field is non-negative before the cross-field check
    const numericFields = ['freeShippingThreshold', 'flatShippingFee', 'codLimit'];
    for (const field of numericFields) {
      if (updates[field] !== undefined && (isNaN(updates[field]) || updates[field] < 0)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a non-negative number`,
        });
      }
    }

    // Cross-field validation: flatShippingFee must not exceed freeShippingThreshold.
    // If only one of the two is being updated, we need to compare against the
    // current stored value for the other — so we read the live settings first.
    //
    // Example of what we're preventing:
    //   freeShippingThreshold: 499, flatShippingFee: 600
    //   → orders never qualify for free shipping, and the fee exceeds the threshold
    //   → logically broken and confusing for customers
    const needsCrossCheck =
      updates.flatShippingFee !== undefined || updates.freeShippingThreshold !== undefined;

    if (needsCrossCheck) {
      const current = await getSettingsDocument();

      // Resolve the final values that would be stored — use updated value if provided,
      // otherwise fall back to the current stored value
      const finalFlatFee   = updates.flatShippingFee       ?? current.flatShippingFee;
      const finalThreshold = updates.freeShippingThreshold ?? current.freeShippingThreshold;

      if (finalFlatFee > finalThreshold) {
        return res.status(400).json({
          success: false,
          message: `flatShippingFee (₹${finalFlatFee}) cannot exceed freeShippingThreshold (₹${finalThreshold}). Orders below the threshold would be charged more than the free shipping cutoff.`,
        });
      }
    }

    // findOneAndUpdate with upsert ensures the document is created if it doesn't exist
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};
