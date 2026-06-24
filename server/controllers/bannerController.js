import Banner from '../models/Banner.js';

// @desc    Get all active banners (Public)
// @route   GET /api/banners
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, data: banners });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all banners including inactive (Admin)
// @route   GET /api/banners/all
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, data: banners });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create banner (Admin)
// @route   POST /api/banners
export const createBanner = async (req, res) => {
  try {
    const { title, subtitle, image, publicId, buttonText, buttonLink, order } = req.body;

    const banner = await Banner.create({
      title,
      subtitle,
      image,
      publicId: publicId || null,
      buttonText,
      buttonLink,
      order: order || 0,
    });

    return res.status(201).json({ success: true, data: banner });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update banner (Admin)
// @route   PUT /api/banners/:id
export const updateBanner = async (req, res) => {
  try {
    const { title, subtitle, image, publicId, buttonText, buttonLink, active, order } = req.body;

    // Build update object conditionally — never overwrite fields with undefined
    const updateData = {};
    if (title !== undefined)      updateData.title = title;
    if (subtitle !== undefined)   updateData.subtitle = subtitle;
    if (image !== undefined)      updateData.image = image;
    if (publicId !== undefined)   updateData.publicId = publicId;
    if (buttonText !== undefined) updateData.buttonText = buttonText;
    if (buttonLink !== undefined) updateData.buttonLink = buttonLink;
    if (active !== undefined)     updateData.active = active;
    if (order !== undefined)      updateData.order = order;

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    return res.status(200).json({ success: true, data: banner });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete banner (Admin)
// @route   DELETE /api/banners/:id
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    await banner.deleteOne();
    return res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle banner active status (Admin)
// @route   PATCH /api/banners/status/:id
export const toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    banner.active = !banner.active;
    await banner.save();

    return res.status(200).json({ success: true, data: banner });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
