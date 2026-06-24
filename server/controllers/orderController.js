import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import razorpay from '../config/razorpay.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import { sendOrderPlacedEmails, sendOrderShippedEmail, sendOrderDeliveredEmail, sendOrderCancelledEmail, sendCancelRequestAdminEmail } from '../services/mailService.js';
import { getSettingsDocument } from '../controllers/settingsController.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { PAYMENT_STATUS } from '../constants/paymentStatus.js';
import { ROLES } from '../constants/roles.js';
import logger from '../utils/logger.js';

// Enforces valid lifecycle paths across fulfillment steps
const isValidStatusTransition = (currentStatus, nextStatus) => {
  const validTransitions = {
    [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.ORDERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PENDING_MANUAL_REVIEW]: [ORDER_STATUS.ORDERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.ORDERED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PACKED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.OUT_FOR_DELIVERY],
    [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
    [ORDER_STATUS.DELIVERED]: [],
    [ORDER_STATUS.CANCELLED]: [],
  };
  return validTransitions[currentStatus]?.includes(nextStatus) || false;
};

// Standardizes payload structural bounds checks
const validateOrderPayload = (body) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, paymentMethod, orderItems } = body;
  if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !paymentMethod) {
    return 'Missing required fields';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerEmail)) return 'Invalid email format';
  if (customerPhone.trim().length < 10) return 'Invalid phone number';

  const { street, city, state, postalCode } = shippingAddress;
  if (!street || !city || !state || !postalCode) {
    return 'Incomplete shipping address details';
  }

  if (!['COD', 'RAZORPAY'].includes(paymentMethod)) return 'Unsupported payment method';
  if (!orderItems || orderItems.length === 0) return 'Cart is empty';
  return null;
};

// @desc    Process order entry (Saves COD or queries confirmed Webhook entries for Online Payments)
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  const { paymentMethod, orderItems, shippingFee = 0, razorpayOrderId } = req.body;

  if (paymentMethod === 'RAZORPAY') {
    try {
      const liveOrder = await Order.findOne({ razorpayOrderId }).lean();
      if (!liveOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (liveOrder.paymentStatus === PAYMENT_STATUS.PENDING) {
        return res.status(202).json({
          success: false,
          orderStatus: ORDER_STATUS.PENDING_PAYMENT,
          message: 'Payment processing'
        });
      }

      if (liveOrder.paymentStatus === PAYMENT_STATUS.FAILED) {
        return res.status(400).json({
          success: false,
          orderStatus: ORDER_STATUS.CANCELLED,
          message: 'Payment failed'
        });
      }

      return res.status(200).json({ success: true, data: liveOrder });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }

  // --- Cash On Delivery (COD) Creation Path ---
  const errorCheck = validateOrderPayload(req.body);
  if (errorCheck) return res.status(400).json({ success: false, message: errorCheck });

  const settings = await getSettingsDocument();

  if (!settings.codEnabled) {
    return res.status(400).json({ success: false, message: 'Cash on Delivery is not available at this time' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let calculatedSubtotal = 0;
    const finalOrderItems = [];

    for (const item of orderItems) {
      if (item.quantity <= 0) {
        throw new Error('Invalid quantity');
      }

      const dbProduct = await Product.findById(item.product).session(session);
      if (!dbProduct || !dbProduct.active) {
        throw new Error('Product not found');
      }

      if (dbProduct.stock < item.quantity) {
        throw new Error('Insufficient stock');
      }

      const actualPrice = dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price;
      calculatedSubtotal += actualPrice * item.quantity;

      finalOrderItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: actualPrice,
        quantity: item.quantity,
      });
    }

    const trustedShippingFee = calculatedSubtotal >= settings.freeShippingThreshold
      ? 0
      : settings.flatShippingFee;
    const finalTotal = calculatedSubtotal + trustedShippingFee;

    if (finalTotal > settings.codLimit) {
      throw new Error(`COD limit exceeded. Max order total via COD is ₹${settings.codLimit}`);
    }

    const order = new Order({
      orderNumber: generateOrderNumber(),
      user: req.user ? req.user._id : null,
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      shippingAddress: req.body.shippingAddress,
      orderItems: finalOrderItems,
      subtotal: calculatedSubtotal,
      shippingFee: trustedShippingFee,
      totalPrice: finalTotal,
      paymentMethod: 'COD',
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.ORDERED,
    });

    const savedOrder = await order.save({ session });

    for (const item of finalOrderItems) {
      const updateResult = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, totalSales: item.quantity } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Insufficient stock');
      }
    }

    await session.commitTransaction();
    session.endSession();

    setImmediate(() => sendOrderPlacedEmails(savedOrder).catch(() => { }));

    return res.status(201).json({ success: true, data: savedOrder });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    const clientSafeMessages = ['Invalid quantity', 'Product not found', 'Insufficient stock'];
    const isClientSafe = clientSafeMessages.includes(error.message) || error.message.includes('COD limit exceeded');

    const message = isClientSafe
      ? error.message
      : (process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong');

    const statusCode = isClientSafe ? 400 : 500;

    return res.status(statusCode).json({ success: false, message });
  }
};

// @desc    Get user order history records
// @route   GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderItems.product', 'images name slug')  // ← add this
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
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get singular order by ID
// @route   GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product', 'images slug')
      .lean();

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user && order.user.toString() !== req.user?._id.toString() && req.user?.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Track order publicly using orderNumber (No PII exposed)
// @route   GET /api/orders/track/:orderNumber
export const trackOrderPublicly = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select('orderNumber orderStatus paymentMethod createdAt')
      .lean();

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all orders across system platform (Admin)
// @route   GET /api/orders
// Query   : ?page=1&limit=20
export const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .lean(),
      Order.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      pagination: { total, page, pages: Math.ceil(total / limit) },
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update order status with strict lifecycle transition rules
// @route   PUT /api/orders/status/:id
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!isValidStatusTransition(order.orderStatus, orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition status from [${order.orderStatus}] to [${orderStatus}]`
      });
    }

    order.orderStatus = orderStatus;
    if (orderStatus === ORDER_STATUS.DELIVERED) {
      order.isPaid = true;
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.deliveredAt = new Date();
    }

    await order.save();

    if (orderStatus === ORDER_STATUS.SHIPPED) {
      sendOrderShippedEmail(order).catch(() => { });
    }
    if (orderStatus === ORDER_STATUS.DELIVERED) {
      sendOrderDeliveredEmail(order).catch(() => { });
    }

    return res.status(200).json({ success: true, message: 'Status updated', data: order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Cancel order and restore stock atomically (Admin direct cancel)
// @route   PUT /api/orders/cancel/:id
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    if (req.user && req.user.role !== ROLES.ADMIN) {
      if (!order.user || order.user.toString() !== req.user._id.toString()) {
        throw new Error('Access denied');
      }
    }

    if (!isValidStatusTransition(order.orderStatus, ORDER_STATUS.CANCELLED)) {
      throw new Error(`Cannot cancel order from current status [${order.orderStatus}]`);
    }

    // Stock restore: only for orders where stock was already deducted.
    // COD orders deduct at creation. Razorpay orders deduct only after webhook confirms payment.
    // Razorpay 'Pending Payment' orders never had stock deducted — skip restore.
    if (order.paymentMethod === 'COD' || order.paymentStatus === PAYMENT_STATUS.PAID) {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity, totalSales: -item.quantity } },
          { session }
        );
      }
    }

    // Razorpay refund — only when payment was actually captured (razorpayPaymentId exists).
    // Called inside the transaction so that if Razorpay rejects the refund, the entire
    // cancel operation aborts — order stays unchanged and admin gets a clear error.
    // COD orders never have razorpayPaymentId so this block is safely skipped for them.
    //
    // skipRefund escape hatch:
    //   If admin already issued the refund manually via the Razorpay dashboard,
    //   calling the refund API again returns "payment already refunded" and the cancel fails.
    //   Admin passes { skipRefund: true } in the request body to bypass the API call
    //   and mark the order as Refunded directly — Razorpay has already handled the money.
    //   Only admins can reach this endpoint so this flag cannot be abused by customers.
    const skipRefund = req.body.skipRefund === true;

    if (order.paymentMethod === 'RAZORPAY' && order.paymentStatus === PAYMENT_STATUS.PAID && order.razorpayPaymentId) {
      if (skipRefund) {
        // Admin has already refunded via Razorpay dashboard — skip the API call.
        // paymentStatus will be set to 'Refunded' below to reflect the actual state.
        logger.info('[cancelOrder] skipRefund=true — Razorpay API call bypassed', { orderNumber: order.orderNumber, orderId: order._id });
      } else {
        try {
          await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(order.totalPrice * 100), // Razorpay expects paise (1 INR = 100 paise)
            speed: 'normal',                             // 'normal' = 5-7 days, 'optimum' = instant if eligible
            notes: {
              reason: 'Order cancelled by admin',
              orderNumber: order.orderNumber,
            },
          });
        } catch (refundError) {
          // Surface a clean error to admin — do not silently swallow Razorpay rejections.
          // Transaction will abort, order stays as-is, admin can retry or refund manually.
          // Common case: admin already refunded via dashboard → pass skipRefund: true to bypass.
          throw new Error(`Razorpay refund failed: ${refundError.error?.description || refundError.message}`);
        }
      }
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    // 'Refunded' signals that the Razorpay refund has been successfully initiated above.
    // 'Cancelled' = no payment was collected (COD or unpaid Razorpay draft).
    const isRefund = order.paymentStatus === PAYMENT_STATUS.PAID; // capture BEFORE overwriting
    order.paymentStatus = isRefund ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.CANCELLED;

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    setImmediate(() => sendOrderCancelledEmail(order, isRefund).catch(() => { }));

    return res.status(200).json({ success: true, message: 'Order cancelled', data: order });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    if (error.message === 'Access denied') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const clientSafeMessages = ['Order not found'];
    const isClientSafe = clientSafeMessages.includes(error.message) || error.message.includes('Cannot cancel order') || error.message.includes('Razorpay refund failed');

    const message = isClientSafe
      ? error.message
      : (process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong');

    const statusCode = isClientSafe ? 400 : 500;

    return res.status(statusCode).json({ success: false, message });
  }
};

// @desc    Get all orders for a specific customer (Admin)
// @route   GET /api/orders/user/:userId
export const getOrdersByUser = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const query = { user: req.params.userId };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
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
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Filter orders by status (Admin)
// @route   GET /api/orders/status/:status
// Query   : ?page=1&limit=20
export const getOrdersByStatus = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const query = { orderStatus: req.params.status };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
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
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CANCELLATION REQUEST FLOW — CUSTOMER SIDE
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Customer submits a cancellation request with a reason
// @route   POST /api/orders/:id/cancel-request
// @access  Private (logged-in customer who owns the order)
//
// Rules enforced:
//   - Order must belong to the requesting customer
//   - Order must be in 'Ordered' or 'Packed' status (before shipment)
//   - Only one active request per order — cannot re-submit if already Pending or Approved
//   - A rejected request CAN be re-submitted (gives customer a second chance if they had a valid reason)
export const submitCancelRequest = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    if (reason.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Reason must be under 500 characters' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ownership check — guest orders cannot use this flow (no user attached)
    if (!order.user || order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only allow requests before the order ships
    const allowedStatuses = [ORDER_STATUS.ORDERED, ORDER_STATUS.PACKED];
    if (!allowedStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cancellation requests can only be submitted for orders that are 'Ordered' or 'Packed'. Current status: ${order.orderStatus}`
      });
    }

    // Block duplicate requests — Pending or Approved means one already exists
    // Rejected requests are allowed to be re-submitted
    if (order.cancellationRequest?.status === 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'A cancellation request is already pending for this order'
      });
    }

    if (order.cancellationRequest?.status === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been approved for cancellation'
      });
    }

    order.cancellationRequest = {
      requestedAt: new Date(),
      reason: reason.trim(),
      status: 'Pending',
      adminNote: null,
      resolvedAt: null,
    };

    await order.save();

    // Notify admin of the new cancellation request (non-blocking)
    setImmediate(() => sendCancelRequestAdminEmail(order).catch(() => { }));

    return res.status(200).json({
      success: true,
      message: 'Cancellation request submitted. We will review it shortly.',
      data: {
        orderNumber: order.orderNumber,
        cancellationRequest: order.cancellationRequest,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Customer checks the status of their cancellation request
// @route   GET /api/orders/:id/cancel-request
// @access  Private (logged-in customer who owns the order)
export const getCancelRequestStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('orderNumber orderStatus cancellationRequest user')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.user || order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!order.cancellationRequest?.status) {
      return res.status(404).json({ success: false, message: 'No cancellation request found for this order' });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        cancellationRequest: order.cancellationRequest,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
