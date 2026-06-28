/**
 * Email template sent to the admin when a customer submits a cancellation request.
 * Called from: mailService.sendCancellationRequestToAdmin()
 */
export const cancellationRequestAdminTemplate = (order) => {
  const { street, city, state, postalCode } = order.shippingAddress;
  const paymentLabel = order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (Razorpay)';

  const itemRows = order.orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">₹${item.price.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return {
    subject: `⚠️ Cancellation Request – ${order.orderNumber} | Varnam Organic`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
      <div style="background:#b91c1c;padding:20px 28px;">
        <h2 style="color:#fff;margin:0;font-size:18px;">⚠️ Cancellation Request Received</h2>
        <p style="color:#fca5a5;margin:4px 0 0;font-size:13px;">A customer has requested to cancel their order. Please review and take action.</p>
      </div>

      <div style="padding:28px;">
        <div style="background:#fef2f2;border-left:4px solid #b91c1c;padding:14px 18px;border-radius:4px;margin-bottom:24px;">
          <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin:0 0 6px;"><strong>Order Status:</strong> ${order.orderStatus}</p>
          <p style="margin:0 0 6px;"><strong>Payment Method:</strong> ${paymentLabel}</p>
          <p style="margin:0 0 6px;"><strong>Payment Status:</strong> ${order.paymentStatus}</p>
          <p style="margin:0;"><strong>Order Total:</strong> ₹${order.totalPrice.toFixed(2)}</p>
        </div>

        <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:4px;margin-bottom:24px;">
          <p style="margin:0 0 6px;font-weight:bold;color:#92400e;">Customer's Reason:</p>
          <p style="margin:0;color:#78350f;font-style:italic;">"${order.cancellationRequest.reason}"</p>
          <p style="margin:8px 0 0;font-size:12px;color:#92400e;">
            Requested at: ${new Date(order.cancellationRequest.requestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </p>
        </div>

        <h3 style="color:#333;border-bottom:1px solid #eee;padding-bottom:8px;">Customer Details</h3>
        <p style="margin:4px 0;"><strong>Name:</strong> ${order.customerName}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${order.customerEmail}</p>
        <p style="margin:4px 0;"><strong>Phone:</strong> ${order.customerPhone}</p>
        <p style="margin:4px 0;"><strong>Address:</strong> ${street}, ${city}, ${state} – ${postalCode}</p>

        <h3 style="color:#333;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:20px;">Items Ordered</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="padding:10px 8px;text-align:left;">Product</th>
              <th style="padding:10px 8px;text-align:center;">Qty</th>
              <th style="padding:10px 8px;text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <p style="margin-top:24px;font-size:13px;color:#888;border-top:1px solid #eee;padding-top:14px;">
          Log in to the admin panel to approve or reject this request. If approved, stock will be
          restored automatically and a refund will be initiated for paid orders.
        </p>
      </div>
    </div>
    `,
  };
};
