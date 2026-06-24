import razorpay from '../config/razorpay.js';
import { sendOrderPlacedEmails, sendRefundConfirmedEmail, sendManualReviewAlertEmail } from '../services/mailService.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getSettingsDocument } from '../controllers/settingsController.js';
import { generateOrderNumber } from '../utils/generateOrderNumber.js';
import logger from '../utils/logger.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { PAYMENT_STATUS } from '../constants/paymentStatus.js';

// Validates Razorpay order payload with the same structural rules as the COD path.
// Kept separate so each path can evolve independently without accidental coupling.
const validateRazorpayPayload = (body) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, orderItems } = body;

  if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
    return 'Missing required fields';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerEmail)) return 'Invalid email format';
  if (String(customerPhone).trim().length < 10) return 'Invalid phone number';

  const { street, city, state, postalCode } = shippingAddress;
  if (!street || !city || !state || !postalCode) {
    return 'Incomplete shipping address details';
  }

  if (!orderItems || orderItems.length === 0) return 'Cart is empty';
  return null;
};

// @desc    Step 1: Calculate pricing, apply request idempotency tracking, initialize gateway checkout order
// @route   POST /api/payment/create-order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderItems, shippingFee = 0, customerName, customerEmail, customerPhone, shippingAddress } = req.body;

    const validationError = validateRazorpayPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // 1. Idempotency Check: Prevent order creation spamming by reusing an identical, active order trace if applicable
    const userIdRef = req.user ? req.user._id : null;
    if (userIdRef) {
      // Sort both arrays by productId so quantity comparison stays correctly aligned
      // regardless of what order the frontend sends items in.
      const incomingSorted = [...orderItems]
        .sort((a, b) => String(a.product).localeCompare(String(b.product)));
      const incomingProductIds = incomingSorted.map(i => String(i.product));
      const incomingQuantities = incomingSorted.map(i => i.quantity);

      const existingActiveDraft = await Order.findOne({
        user: userIdRef,
        paymentMethod: 'RAZORPAY',
        orderStatus: ORDER_STATUS.PENDING_PAYMENT,
        paymentStatus: PAYMENT_STATUS.PENDING,
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
      }).sort({ createdAt: -1 });

      if (existingActiveDraft) {
        const draftSorted = [...existingActiveDraft.orderItems]
          .sort((a, b) => String(a.product).localeCompare(String(b.product)));
        const draftProductIds = draftSorted.map(i => String(i.product));
        const draftQuantities = draftSorted.map(i => i.quantity);

        const sameCart =
          JSON.stringify(incomingProductIds) === JSON.stringify(draftProductIds) &&
          JSON.stringify(incomingQuantities) === JSON.stringify(draftQuantities);

        if (sameCart) {
          const rzpOrderProfile = await razorpay.orders.fetch(existingActiveDraft.razorpayOrderId);
          if (rzpOrderProfile && rzpOrderProfile.status === 'created') {
            return res.status(200).json({ success: true, data: rzpOrderProfile, isReusedDraft: true });
          }
        }
        // If cart changed, fall through and create a fresh Razorpay order below
      }
    }

    let calculatedSubtotal = 0;
    const verifiedOrderItems = [];

    for (const item of orderItems) {
      if (item.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid quantity' });
      }

      const dbProduct = await Product.findById(item.product);
      if (!dbProduct || !dbProduct.active) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({ success: false, message: 'Insufficient stock' });
      }

      const actualPrice = dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price;
      calculatedSubtotal += actualPrice * item.quantity;

      verifiedOrderItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: actualPrice,
        quantity: item.quantity,
      });
    }

    // Load business config — shipping fee is always server-computed from Settings.
    // Frontend-supplied shippingFee value is intentionally ignored.
    const settings = await getSettingsDocument();
    const trustedShippingFee = calculatedSubtotal >= settings.freeShippingThreshold
      ? 0
      : settings.flatShippingFee;
    const trustedTotalAmount = calculatedSubtotal + trustedShippingFee;

    const options = {
      amount: Math.round(trustedTotalAmount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const pendingOrder = new Order({
      orderNumber: generateOrderNumber(),
      user: userIdRef,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      orderItems: verifiedOrderItems,
      subtotal: calculatedSubtotal,
      shippingFee: trustedShippingFee,
      totalPrice: trustedTotalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING_PAYMENT,
      razorpayOrderId: razorpayOrder.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour cleanup window index constraint parameters
    });

    await pendingOrder.save();
    return res.status(200).json({ success: true, data: razorpayOrder });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Step 2: Micro-engineered raw webhook listener providing atomic transaction stock mutations
// @route   POST /api/payment/webhook
export const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  // Guard: both must be present before attempting crypto operations
  if (!secret || !signature) {
    return res.status(400).json({ success: false, message: 'Webhook signature verification failed' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks.
  // Regular === leaks information by returning faster when the first differing
  // byte is found — an attacker can measure this to guess the signature byte by byte.
  // timingSafeEqual always takes the same amount of time regardless of content.
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer  = Buffer.from(expectedSignature, 'utf8');

  const isValid =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Webhook signature verification failed' });
  }

  const eventPayload = JSON.parse(req.body.toString());

  // Structured log — visible in Render dashboard, searchable by event type and orderId
  logger.info('Razorpay webhook received', {
    event   : eventPayload.event,
    orderId : eventPayload.payload?.payment?.entity?.order_id,
    paymentId: eventPayload.payload?.payment?.entity?.id,
  });

  const allowedEvents = ['payment.captured', 'payment.failed', 'refund.processed'];
  if (!allowedEvents.includes(eventPayload.event)) {
    return res.status(200).json({ status: 'ignored' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const paymentAttributes = eventPayload.payload.payment.entity;
    const targetRazorpayOrderId = paymentAttributes.order_id;

    const order = await Order.findOne({ razorpayOrderId: targetRazorpayOrderId }).session(session);
    if (!order) {
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ status: 'order_not_found' });
    }

    if (eventPayload.event === 'payment.captured') {
      if (order.paymentStatus === PAYMENT_STATUS.PAID || order.razorpayPaymentId) {
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ status: 'already_processed' });
      }

      // Merge the availability-check pass and the deduction pass into a single
      // atomic updateOne per item. The previous two-loop approach had a race window —
      // another concurrent order could take the last unit between the check loop and
      // the write loop, causing the $gte guard to fire and throw, which aborted the
      // transaction and returned a 500 instead of routing to Pending Manual Review.
      //
      // Now, each item is checked AND deducted in one operation. modifiedCount === 0
      // means stock ran out at the exact moment of update — treated as a stock conflict
      // and routed to manual review rather than crashing.
      let stockConflict = false;
      const deductionResults = [];

      for (const item of order.orderItems) {
        const updateResult = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity }, active: true },
          { $inc: { stock: -item.quantity, totalSales: item.quantity } },
          { session }
        );

        if (updateResult.modifiedCount === 0) {
          stockConflict = true;
          break;
        }

        deductionResults.push(item);
      }

      // If any item failed the atomic deduction, roll back successful deductions
      // within this transaction and route to manual review.
      if (stockConflict) {
        // Undo any partial deductions already applied in this transaction
        for (const item of deductionResults) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity, totalSales: -item.quantity } },
            { session }
          );
        }

        order.paymentStatus = PAYMENT_STATUS.PAID;
        order.orderStatus = ORDER_STATUS.PENDING_MANUAL_REVIEW;
        order.razorpayPaymentId = paymentAttributes.id;
        order.isPaid = true;
        order.paidAt = new Date();
        // null — not undefined — so Mongoose marks the field modified and MongoDB
        // sets it to null, which the TTL index ignores. Setting undefined leaves
        // the original Date value in place and the TTL janitor would eventually
        // delete this paid order after the original 24h window.
        order.expiresAt = null;

        await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        // sendOrderPlacedEmails notifies customer that payment was received.
        // sendManualReviewAlertEmail sends a separate URGENT alert to admin —
        // the normal admin template just says "new order", which doesn't convey
        // that this order has a stock problem and needs manual action within 24 hours.
        setImmediate(() => sendOrderPlacedEmails(order).catch(() => {}));
        setImmediate(() => sendManualReviewAlertEmail(order).catch(() => {}));
        return res.status(200).json({ status: 'routed_to_manual_review' });
      }

      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.orderStatus = ORDER_STATUS.ORDERED;
      order.isPaid = true;
      order.paidAt = new Date();
      order.razorpayPaymentId = paymentAttributes.id;
      // null — not undefined — so the TTL index ignores this confirmed order.
      order.expiresAt = null;

      await order.save({ session });

      // Send order confirmation emails after successful payment (non-blocking, outside transaction)
      setImmediate(() => sendOrderPlacedEmails(order).catch(() => {}));
    }

    if (eventPayload.event === 'payment.failed') {
      if (order.paymentStatus === PAYMENT_STATUS.FAILED) {
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ status: 'already_marked_failed' });
      }

      order.paymentStatus = PAYMENT_STATUS.FAILED;
      order.orderStatus = ORDER_STATUS.CANCELLED;
      order.failureReason = paymentAttributes.error_description || 'Payment rejected';

      await order.save({ session });
    }

    // ── refund.processed ────────────────────────────────────────────────────────
    // Fired by Razorpay when a refund actually completes (money returned to customer).
    // This is separate from when we initiated the refund — Razorpay processes refunds
    // asynchronously and this webhook confirms the money has moved.
    //
    // What we do:
    //   1. Find the order by razorpayPaymentId (the original payment, not the refund ID)
    //   2. Set refundedAt timestamp — confirms refund actually landed
    //   3. Send "refund confirmed" email to customer with completion message
    //
    // Idempotent: if refundedAt is already set, skip silently.
    if (eventPayload.event === 'refund.processed') {
      const refundEntity = eventPayload.payload.refund.entity;
      const originalPaymentId = refundEntity.payment_id;

      const refundedOrder = await Order.findOne({ razorpayPaymentId: originalPaymentId }).session(session);

      if (!refundedOrder) {
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ status: 'refund_order_not_found' });
      }

      // Idempotency — refund already confirmed, skip
      if (refundedOrder.refundedAt) {
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ status: 'refund_already_confirmed' });
      }

      refundedOrder.refundedAt = new Date();
      await refundedOrder.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Send refund confirmed email after transaction closes (non-blocking)
      setImmediate(() => sendRefundConfirmedEmail(refundedOrder).catch(() => {}));

      return res.status(200).json({ status: 'refund_confirmed' });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({ status: 'ok' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};