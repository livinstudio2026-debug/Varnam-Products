import Product from '../models/Product.js';
import Category from '../models/Category.js';
import slugify from 'slugify';

// @desc    Get products with filters & pagination (Public)
// @route   GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

    // effectivePrice = discountPrice when set (> 0), otherwise falls back to price.
    // All filtering and sorting must use this computed value so that discounted
    // products behave consistently with what the customer actually pays.
    const effectivePriceExpr = {
      $cond: {
        if: { $gt: ['$discountPrice', 0] },
        then: '$discountPrice',
        else: '$price',
      },
    };

    // Build the match stage — always filter active products first
    const matchStage = { active: true };

    // Price range filter against effective selling price using $expr
    if (minPrice || maxPrice) {
      const priceConditions = [];
      if (minPrice) {
        priceConditions.push({ $gte: [effectivePriceExpr, Number(minPrice)] });
      }
      if (maxPrice) {
        priceConditions.push({ $lte: [effectivePriceExpr, Number(maxPrice)] });
      }
      matchStage.$expr = priceConditions.length === 1
        ? priceConditions[0]
        : { $and: priceConditions };
    }

    const skipIndex = (Number(page) - 1) * Number(limit);

    // Determine sort field and direction
    let sortStage;
    if (sort === 'price-low')  sortStage = { effectivePrice: 1 };
    else if (sort === 'price-high') sortStage = { effectivePrice: -1 };
    else if (sort === 'popular')    sortStage = { totalSales: -1 };
    else                            sortStage = { createdAt: -1 };

    // Use aggregation pipeline so we can compute effectivePrice as a field,
    // then filter, sort, paginate, and populate category — all in one query.
    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          effectivePrice: effectivePriceExpr,
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skipIndex },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
                pipeline: [{ $project: { name: 1, slug: 1 } }],
              },
            },
            {
              $unwind: {
                path: '$category',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
        },
      },
    ];

    const [result] = await Product.aggregate(pipeline);
    const total = result.metadata[0]?.total || 0;
    const products = result.data;

    res.status(200).json({
      success: true,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by slug (Public)
// @route   GET /api/products/:slug
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get best sellers (Public)
// @route   GET /api/products/best-sellers
export const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({ bestSeller: true, active: true }).populate('category', 'name slug');
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured products (Public)
// @route   GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true, active: true }).populate('category', 'name slug');
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search products using text index (Public)
// @route   GET /api/products/search
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query parameter "q" missing' });

    const products = await Product.find(
      { $text: { $search: q }, active: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .populate('category', 'name slug');

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get products by category slug (Public)
// @route   GET /api/products/category/:slug
export const getProductsByCategorySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, active: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const products = await Product.find({ category: category._id, active: true }).populate('category', 'name slug');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Product (Admin)
// @route   POST /api/products
export const createProduct = async (req, res) => {
  try {
    const slug = slugify(req.body.name, { lower: true, strict: true });
    const product = await Product.create({ ...req.body, slug });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update Product (Admin)
// @route   PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    if (req.body.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete Product (Admin)
// @route   DELETE /api/products/:id
// NOTE: This performs a soft delete (active: false) rather than a hard delete.
// Hard deleting a product would orphan its ObjectId inside existing order records,
// breaking populate('orderItems.product') calls across the order history.
// Soft delete hides the product from the storefront while keeping the reference intact.
// Use the DB directly if a permanent hard delete is ever genuinely required.
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.active = false;
    await product.save();

    res.status(200).json({ success: true, message: 'Product deactivated and hidden from storefront' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update specific product stock explicitly (Admin)
// @route   PATCH /api/products/stock/:id
export const updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative stock value required' });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle manual best seller status (Admin)
// @route   PATCH /api/products/best-seller/:id
export const toggleBestSeller = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.bestSeller = !product.bestSeller;
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle manual featured status (Admin)
// @route   PATCH /api/products/featured/:id
export const toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.featured = !product.featured;
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle active visibility state (Admin)
// @route   PATCH /api/products/status/:id
export const toggleStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.active = !product.active;
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};