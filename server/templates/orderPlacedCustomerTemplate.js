/**
 * Email template sent to the customer immediately after order placement.
 * Covers both COD and Razorpay (webhook-confirmed) orders.
 */
export const orderPlacedCustomerTemplate = (order) => {
  const itemRows = order.orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;">${item.name}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;text-align:right;">₹${item.price.toFixed(2)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const { street, city, state, postalCode, country } = order.shippingAddress;
  const paymentLabel = order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment (Razorpay)';
  const paymentStatusLabel = order.paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Pending (pay on delivery)';

  return {
    subject: `Order Confirmed – ${order.orderNumber} | Varnam Organic`,
    html: `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fffdf8;border:1px solid #e8dfd0;border-radius:8px;overflow:hidden;">
      <div style="background:#3d6b45;padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">Varnam Organic</h1>
        <p style="color:#c8e6c9;margin:6px 0 0;font-size:13px;">Pure. Natural. Trusted.</p>
      </div>

      <div style="padding:32px;">
        <h2 style="color:#3d6b45;margin-top:0;">Thank you, ${order.customerName}!</h2>
        <p style="color:#555;line-height:1.6;">
          Your order has been successfully placed. We'll keep you updated as it gets packed and shipped.
        </p>

        <div style="background:#f4f0e8;border-radius:6px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin:0 0 6px;"><strong>Payment Method:</strong> ${paymentLabel}</p>
          <p style="margin:0;"><strong>Payment Status:</strong> ${paymentStatusLabel}</p>
        </div>

        <h3 style="color:#3d6b45;border-bottom:2px solid #e8dfd0;padding-bottom:8px;">Order Summary</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f4f0e8;">
              <th style="padding:10px 8px;text-align:left;">Product</th>
              <th style="padding:10px 8px;text-align:center;">Qty</th>
              <th style="padding:10px 8px;text-align:right;">Price</th>
              <th style="padding:10px 8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="text-align:right;margin-top:12px;font-size:14px;color:#555;">
          <p style="margin:4px 0;">Subtotal: ₹${order.subtotal.toFixed(2)}</p>
          <p style="margin:4px 0;">Shipping: ${order.shippingFee === 0 ? '<span style="color:#3d6b45;">FREE</span>' : '₹' + order.shippingFee.toFixed(2)}</p>
          <p style="margin:8px 0 0;font-size:16px;font-weight:bold;color:#3d6b45;">
            Total: ₹${order.totalPrice.toFixed(2)}
          </p>
        </div>

        <h3 style="color:#3d6b45;border-bottom:2px solid #e8dfd0;padding-bottom:8px;margin-top:24px;">Shipping To</h3>
        <p style="color:#555;line-height:1.8;margin:0;">
          ${street}, ${city}<br/>
          ${state} – ${postalCode}<br/>
          ${country}
        </p>

        <p style="color:#888;font-size:13px;margin-top:28px;border-top:1px solid #e8dfd0;padding-top:16px;">
          You can track your order anytime using your order number: <strong>${order.orderNumber}</strong><br/>
          Questions? Reply to this email or contact us at ${process.env.MAIL_FROM}.
        </p>
      </div>

      <div style="background:#3d6b45;padding:16px;text-align:center;">
        <p style="color:#c8e6c9;font-size:12px;margin:0;">© ${new Date().getFullYear()} Varnam Organic. All rights reserved.</p>
      </div>
    </div>
    `,
  };
};
