import Category from '../models/Category.js';
import Product from '../models/Product.js';
import slugify from 'slugify';

// @desc    Get all active categories (Public)
// @route   GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single category by slug (Public)
// @route   GET /api/categories/:slug
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, active: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create category (Admin)
// @route   POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name, image } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ name, slug, image });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { name, image, active } = req.body;
    const updateData = {};

    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true, strict: true });
    }
    if (image !== undefined) updateData.image = image;
    if (active !== undefined) updateData.active = active;

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Nullify the category reference on all linked products before deletion.
    // Without this, those products would hold a dangling ObjectId that breaks
    // populate calls and category filter queries across the entire catalog.
    await Product.updateMany(
      { category: category._id },
      { $set: { category: null } }
    );

    await category.deleteOne();
    res.status(200).json({ success: true, message: 'Category deleted and linked products unlinked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};