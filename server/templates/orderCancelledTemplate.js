/**
 * Email template sent to the customer when their order is cancelled.
 *
 * Handles two cases:
 *   isRefund: false → COD cancellation — no money was collected, nothing to refund
 *   isRefund: true  → Razorpay cancellation — payment was made, refund has been initiated
 *
 * Called from: mailService.sendOrderCancelledEmail()
 */
export const orderCancelledTemplate = (order, isRefund = false) => {
  const itemRows = order.orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;">${item.name}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;text-align:right;">₹${item.price.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const refundBlock = isRefund
    ? `
      <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          💰 <strong>Refund Initiated</strong><br/>
          Since you paid online, a full refund of <strong>₹${order.totalPrice.toFixed(2)}</strong> has been 
          initiated to your original payment method.<br/><br/>
          <span style="font-size:13px;color:#78350f;">
            Expected refund time:<br/>
            UPI → within 2 hours<br/>
            Debit / Credit Card → 3–7 business days<br/>
            Net Banking → 3–5 business days
          </span>
        </p>
      </div>`
    : `
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#166534;font-size:14px;">
          ✅ <strong>No payment was collected</strong><br/>
          This was a Cash on Delivery order — no amount has been charged to you.
        </p>
      </div>`;

  const subject = isRefund
    ? `Order Cancelled & Refund Initiated – ${order.orderNumber} | Varnam Organic`
    : `Order Cancelled – ${order.orderNumber} | Varnam Organic`;

  return {
    subject,
    html: `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fffdf8;border:1px solid #e8dfd0;border-radius:8px;overflow:hidden;">
      <div style="background:#3d6b45;padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">Varnam Organic</h1>
        <p style="color:#c8e6c9;margin:6px 0 0;font-size:13px;">Pure. Natural. Trusted.</p>
      </div>

      <div style="padding:32px;">
        <h2 style="color:#dc2626;margin-top:0;">Your order has been cancelled</h2>
        <p style="color:#555;line-height:1.6;">
          Hi ${order.customerName}, your order <strong>${order.orderNumber}</strong> has been 
          cancelled. We're sorry for the inconvenience.
        </p>

        <div style="background:#f4f0e8;border-radius:6px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin:0 0 6px;"><strong>Payment Method:</strong> ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
          <p style="margin:0;"><strong>Status:</strong> <span style="color:#dc2626;">Cancelled</span></p>
        </div>

        ${refundBlock}

        <h3 style="color:#3d6b45;border-bottom:2px solid #e8dfd0;padding-bottom:8px;">Cancelled Items</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f4f0e8;">
              <th style="padding:10px 8px;text-align:left;">Product</th>
              <th style="padding:10px 8px;text-align:center;">Qty</th>
              <th style="padding:10px 8px;text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <p style="color:#555;line-height:1.6;margin-top:20px;">
          If you have any questions or didn't request this cancellation, 
          please contact us immediately at ${process.env.MAIL_FROM}.
        </p>

        <p style="color:#888;font-size:13px;margin-top:28px;border-top:1px solid #e8dfd0;padding-top:16px;">
          We'd love to serve you again. Visit us anytime at Varnam Organic.
        </p>
      </div>

      <div style="background:#3d6b45;padding:16px;text-align:center;">
        <p style="color:#c8e6c9;font-size:12px;margin:0;">© ${new Date().getFullYear()} Varnam Organic. All rights reserved.</p>
      </div>
    </div>
    `,
  };
};
