import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import razorpay from '../config/razorpay.js';
import { sendCancelRequestResolvedEmail } from '../services/mailService.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { PAYMENT_STATUS } from '../constants/paymentStatus.js';
import { ROLES } from '../constants/roles.js';

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

// @desc    Main dashboard — summary stats + recent orders + low stock
// @route   GET /api/admin/dashboard
export const getDashboard = async (req, res) => {
  try {
    const confirmedStatuses = [
      ORDER_STATUS.ORDERED,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
    ];
    const excludedStatuses = [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CANCELLED];

    const [
      totalOrders,
      salesResult,
      totalCustomers,
      recentOrders,
      lowStockProducts,
      ordersByStatus,
      todayResult,
      pendingCancelRequests,
    ] = await Promise.all([
      Order.countDocuments({ orderStatus: { $in: confirmedStatuses } }),

      Order.aggregate([
        {
          $match: {
            orderStatus: { $nin: excludedStatuses },
            $and: [
              { paymentStatus: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING] } },
              { paymentStatus: { $ne: PAYMENT_STATUS.REFUNDED } },
            ],
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      User.countDocuments({ role: ROLES.CUSTOMER }),

      Order.find({ orderStatus: { $nin: [ORDER_STATUS.PENDING_PAYMENT] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber customerName totalPrice orderStatus paymentMethod paymentStatus createdAt')
        .lean(),

      Product.find({ active: true, stock: { $lte: 10 } })
        .sort({ stock: 1 })
        .limit(10)
        .select('name stock price discountPrice images')
        .lean(),

      Order.aggregate([
        { $match: { orderStatus: { $nin: [ORDER_STATUS.PENDING_PAYMENT] } } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
            orderStatus: { $nin: excludedStatuses },
            $and: [
              { paymentStatus: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING] } },
              { paymentStatus: { $ne: PAYMENT_STATUS.REFUNDED } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
      ]),

      // Count of pending cancellation requests — surfaced on dashboard so admin never misses them
      Order.countDocuments({ 'cancellationRequest.status': 'Pending' }),
    ]);

    const totalSales = salesResult[0]?.total || 0;
    const todayRevenue = todayResult[0]?.revenue || 0;
    const todayOrders = todayResult[0]?.orders || 0;

    const statusMap = {};
    ordersByStatus.forEach(({ _id, count }) => {
      statusMap[_id] = count;
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalSales,
          totalCustomers,
          todayRevenue,
          todayOrders,
          pendingCancelRequests,
        },
        ordersByStatus: statusMap,
        recentOrders,
        lowStockProducts,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// ─────────────────────────────────────────────
// SALES ANALYTICS
// ─────────────────────────────────────────────

// @desc    Sales analytics — daily revenue for last N days (default 30)
// @route   GET /api/admin/sales?days=30
export const getSalesAnalytics = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const excludedStatuses = [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CANCELLED];

    const [dailySales, topProducts, paymentMethodSplit, monthlySales] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            orderStatus: { $nin: excludedStatuses },
            $and: [
              { paymentStatus: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING] } },
              { paymentStatus: { $ne: PAYMENT_STATUS.REFUNDED } },
            ],
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),

      Order.aggregate([
        {
          $match: {
            orderStatus: { $nin: excludedStatuses },
            $and: [
              { paymentStatus: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING] } },
              { paymentStatus: { $ne: PAYMENT_STATUS.REFUNDED } },
            ],
          },
        },
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.product',
            name: { $first: '$orderItems.name' },
            totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
            totalQuantity: { $sum: '$orderItems.quantity' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
      ]),

      Order.aggregate([
        {
          $match: {
            orderStatus: { $nin: excludedStatuses },
          },
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)),
            },
            orderStatus: { $nin: excludedStatuses },
            $and: [
              { paymentStatus: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PENDING] } },
              { paymentStatus: { $ne: PAYMENT_STATUS.REFUNDED } },
            ],
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        dailySales,
        topProducts,
        paymentMethodSplit,
        monthlySales,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// ─────────────────────────────────────────────
// LOW STOCK
// ─────────────────────────────────────────────

// @desc    Products with stock at or below threshold (default 10)
// @route   GET /api/admin/low-stock?threshold=10
export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = Math.max(Number(req.query.threshold) || 10, 0);

    const products = await Product.find({ active: true, stock: { $lte: threshold } })
      .sort({ stock: 1 })
      .populate('category', 'name slug')
      .select('name slug stock price discountPrice images category')
      .lean();

    return res.status(200).json({
      success: true,
      threshold,
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// ─────────────────────────────────────────────
// CUSTOMER MANAGEMENT
// ─────────────────────────────────────────────

// @desc    Get all customers with order count and total spend
// @route   GET /api/admin/customers
export const getCustomers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // Build filter — always scope to customers only
    const filter = { role: ROLES.CUSTOMER };

    // blocked=true → only blocked, blocked=false → only active
    // blocked absent (or 'all') → no filter applied
    if (req.query.blocked === 'true')  filter.isBlocked = true;
    if (req.query.blocked === 'false') filter.isBlocked = false;

    // search → case-insensitive match on name, email, or phone
    if (req.query.search && req.query.search.trim()) {
      const q = req.query.search.trim();
      filter.$or = [
        { name:  { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean(),
      User.countDocuments(filter),
    ]);

    const customerIds = customers.map((c) => c._id);
    const orderStats = await Order.aggregate([
      {
        $match: {
          user: { $in: customerIds },
          orderStatus: { $nin: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CANCELLED] },
          paymentStatus: { $ne: PAYMENT_STATUS.REFUNDED },
        },
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpend: { $sum: '$totalPrice' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);

    const statsMap = {};
    orderStats.forEach((s) => {
      statsMap[s._id.toString()] = s;
    });

    const enriched = customers.map((c) => ({
      ...c,
      orderCount: statsMap[c._id.toString()]?.orderCount || 0,
      totalSpend: statsMap[c._id.toString()]?.totalSpend || 0,
      lastOrderAt: statsMap[c._id.toString()]?.lastOrderAt || null,
    }));

    return res.status(200).json({
      success: true,
      pagination: { total, page, pages: Math.ceil(total / limit) },
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    Get single customer profile + full order history (paginated)
// @route   GET /api/admin/customers/:id
export const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password').lean();
    if (!customer || customer.role !== ROLES.CUSTOMER) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const page  = Math.max(Number(req.query.page)  || 1,  1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find({ user: customer._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: customer._id }),
    ]);

    // Compute lifetime spend across all orders (not just the current page)
    const spendResult = await Order.aggregate([
      {
        $match: {
          user: customer._id,
          orderStatus: { $nin: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CANCELLED] },
          paymentStatus: { $ne: PAYMENT_STATUS.REFUNDED },
        },
      },
      { $group: { _id: null, totalSpend: { $sum: '$totalPrice' } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        customer,
        orders,
        pagination: { total: totalOrders, page, pages: Math.ceil(totalOrders / limit) },
        stats: {
          orderCount: totalOrders,
          totalSpend: spendResult[0]?.totalSpend || 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    Block or unblock a customer account
// @route   PATCH /api/admin/customers/block/:id
export const toggleBlockCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer || customer.role !== ROLES.CUSTOMER) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isBlocked = !customer.isBlocked;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: `Customer ${customer.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: { _id: customer._id, name: customer.name, email: customer.email, isBlocked: customer.isBlocked },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// ─────────────────────────────────────────────
// CANCELLATION REQUEST MANAGEMENT — ADMIN SIDE
// ─────────────────────────────────────────────

// @desc    Get all pending cancellation requests
// @route   GET /api/admin/cancel-requests
// @query   ?status=Pending (default) | Approved | Rejected | all
// @access  Admin
export const getCancelRequests = async (req, res) => {
  try {
    const page  = Math.max(Number(req.query.page)  || 1,  1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const statusFilter = req.query.status || 'Pending';

    // 'all' returns every order that has ever had a cancellation request
    const query = statusFilter === 'all'
      ? { 'cancellationRequest.status': { $exists: true } }
      : { 'cancellationRequest.status': statusFilter };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ 'cancellationRequest.requestedAt': -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone')
        .select('orderNumber customerName customerEmail customerPhone orderStatus paymentMethod totalPrice cancellationRequest createdAt user')
        .lean(),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      pagination: { total, page, pages: Math.ceil(total / limit) },
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// @desc    Approve a cancellation request — runs full cancel logic (stock restore + email)
// @route   PUT /api/admin/cancel-requests/:id/approve
// @access  Admin
//
// :id is the Order._id (not a separate request document — the request is embedded in the order)
export const approveCancelRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.cancellationRequest?.status) {
      throw new Error('No cancellation request found on this order');
    }

    if (order.cancellationRequest.status !== 'Pending') {
      throw new Error(`Cannot approve a request that is already '${order.cancellationRequest.status}'`);
    }

    // Validate the order can still be cancelled at this point.
    // Edge case: between the customer submitting the request and the admin approving,
    // the order status may have advanced to Shipped — in which case it's too late.
    if (![ORDER_STATUS.ORDERED, ORDER_STATUS.PACKED].includes(order.orderStatus)) {
      throw new Error(`Order can no longer be cancelled. Current status: ${order.orderStatus}`);
    }

    // Restore stock — same logic as direct cancelOrder
    if (order.paymentMethod === 'COD' || order.paymentStatus === PAYMENT_STATUS.PAID) {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity, totalSales: -item.quantity } },
          { session }
        );
      }
    }

    // Razorpay refund — same pattern as direct cancelOrder.
    // Only runs when payment was actually captured. COD orders safely skipped.
    // Inside the transaction so a Razorpay rejection aborts the whole approval.
    if (order.paymentMethod === 'RAZORPAY' && order.paymentStatus === PAYMENT_STATUS.PAID && order.razorpayPaymentId) {
      try {
        await razorpay.payments.refund(order.razorpayPaymentId, {
          amount: Math.round(order.totalPrice * 100),
          speed: 'normal',
          notes: {
            reason: order.cancellationRequest.reason || 'Cancellation request approved by admin',
            orderNumber: order.orderNumber,
          },
        });
      } catch (refundError) {
        throw new Error(`Razorpay refund failed: ${refundError.error?.description || refundError.message}`);
      }
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    const isRefund = order.paymentStatus === PAYMENT_STATUS.PAID; // capture BEFORE overwriting
    order.paymentStatus = isRefund ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.CANCELLED;

    order.cancellationRequest.status = 'Approved';
    order.cancellationRequest.resolvedAt = new Date();

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    // sendCancelRequestResolvedEmail covers the approved case fully — it includes
    // the refund block and the order summary. sendOrderCancelledEmail is only for
    // direct admin cancels (PUT /api/orders/cancel/:id), not for this request flow.
    // Sending both would give the customer two near-identical emails.
    setImmediate(() => {
      sendCancelRequestResolvedEmail(order, 'Approved', isRefund).catch(() => {});
    });

    return res.status(200).json({
      success: true,
      message: 'Cancellation request approved. Order has been cancelled.',
      data: order,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    const clientSafeMessages = [
      'Order not found',
      'No cancellation request found on this order',
    ];
    const isClientSafe =
      clientSafeMessages.includes(error.message) ||
      error.message.includes('Cannot approve') ||
      error.message.includes('Order can no longer be cancelled') ||
      error.message.includes('Razorpay refund failed');

    return res.status(isClientSafe ? 400 : 500).json({
      success: false,
      message: isClientSafe
        ? error.message
        : (process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'),
    });
  }
};

// @desc    Reject a cancellation request — order continues, customer gets rejection email
// @route   PUT /api/admin/cancel-requests/:id/reject
// @access  Admin
export const rejectCancelRequest = async (req, res) => {
  try {
    const { adminNote } = req.body; // Optional note explaining why the request was rejected

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.cancellationRequest?.status) {
      return res.status(400).json({ success: false, message: 'No cancellation request found on this order' });
    }

    if (order.cancellationRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a request that is already '${order.cancellationRequest.status}'`,
      });
    }

    order.cancellationRequest.status = 'Rejected';
    order.cancellationRequest.resolvedAt = new Date();
    order.cancellationRequest.adminNote = adminNote?.trim() || null;

    await order.save();

    // Notify customer: rejected — email explains decision and includes admin note if provided
    setImmediate(() => {
      sendCancelRequestResolvedEmail(order, 'Rejected').catch(() => {});
    });

    return res.status(200).json({
      success: true,
      message: 'Cancellation request rejected. Order will continue.',
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};