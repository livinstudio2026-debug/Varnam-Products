/**
 * Email template sent to the admin when a new order is placed.
 * Contains full order details including customer contact info.
 */
export const orderPlacedAdminTemplate = (order) => {
  const itemRows = order.orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">₹${item.price.toFixed(2)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const { street, city, state, postalCode, country } = order.shippingAddress;
  const paymentLabel = order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (Razorpay)';

  return {
    subject: `🛒 New Order Received – ${order.orderNumber} | ₹${order.totalPrice.toFixed(2)}`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
      <div style="background:#1a1a2e;padding:20px 28px;">
        <h2 style="color:#fff;margin:0;font-size:18px;">🛒 New Order – Varnam Organic Admin</h2>
        <p style="color:#aaa;margin:4px 0 0;font-size:13px;">A new order has been placed and requires fulfillment.</p>
      </div>

      <div style="padding:28px;">
        <div style="background:#f8f8f8;border-left:4px solid #3d6b45;padding:14px 18px;border-radius:4px;margin-bottom:24px;">
          <p style="margin:0 0 5px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin:0 0 5px;"><strong>Payment Method:</strong> ${paymentLabel}</p>
          <p style="margin:0 0 5px;"><strong>Payment Status:</strong> ${order.paymentStatus}</p>
          <p style="margin:0;"><strong>Order Status:</strong> ${order.orderStatus}</p>
        </div>

        <h3 style="color:#333;border-bottom:1px solid #eee;padding-bottom:8px;">Customer Details</h3>
        <p style="margin:4px 0;"><strong>Name:</strong> ${order.customerName}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${order.customerEmail}</p>
        <p style="margin:4px 0;"><strong>Phone:</strong> ${order.customerPhone}</p>
        <p style="margin:4px 0;"><strong>Address:</strong> ${street}, ${city}, ${state} – ${postalCode}, ${country}</p>

        <h3 style="color:#333;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:20px;">Items Ordered</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f0f0f0;">
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
          <p style="margin:4px 0;">Shipping: ₹${order.shippingFee.toFixed(2)}</p>
          <p style="margin:8px 0 0;font-size:16px;font-weight:bold;color:#1a1a2e;">
            Order Total: ₹${order.totalPrice.toFixed(2)}
          </p>
        </div>

        ${order.razorpayPaymentId ? `<p style="margin-top:16px;font-size:13px;color:#666;"><strong>Razorpay Payment ID:</strong> ${order.razorpayPaymentId}</p>` : ''}

        <p style="margin-top:24px;font-size:13px;color:#888;border-top:1px solid #eee;padding-top:14px;">
          Log in to the admin panel to update the order status and begin fulfillment.
        </p>
      </div>
    </div>
    `,
  };
};
