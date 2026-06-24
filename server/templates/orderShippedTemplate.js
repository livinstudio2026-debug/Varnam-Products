/**
 * Email template sent to the customer when order status transitions to 'Shipped'.
 * Triggered automatically from updateOrderStatus in orderController.js.
 */
export const orderShippedTemplate = (order) => {
  return {
    subject: `Your Order is On Its Way! – ${order.orderNumber} | Varnam Organic`,
    html: `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fffdf8;border:1px solid #e8dfd0;border-radius:8px;overflow:hidden;">
      <div style="background:#3d6b45;padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">Varnam Organic</h1>
        <p style="color:#c8e6c9;margin:6px 0 0;font-size:13px;">Pure. Natural. Trusted.</p>
      </div>

      <div style="padding:32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">🚚</div>
        <h2 style="color:#3d6b45;margin-top:0;">Your order has been shipped!</h2>
        <p style="color:#555;line-height:1.6;max-width:440px;margin:0 auto;">
          Good news, ${order.customerName}! Your Varnam Organic order is now on its way to you.
          Our natural products have been carefully packed and handed over to our delivery partner.
        </p>

        <div style="background:#f4f0e8;border-radius:6px;padding:16px 20px;margin:24px auto;text-align:left;max-width:360px;">
          <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin:0 0 6px;"><strong>Current Status:</strong> <span style="color:#3d6b45;font-weight:bold;">Shipped</span></p>
          <p style="margin:0;"><strong>Expected Delivery:</strong> 3–7 business days</p>
        </div>

        <p style="color:#555;line-height:1.6;margin-top:16px;">
          We'll send you another email once your order has been delivered.
        </p>

        <p style="color:#888;font-size:13px;margin-top:28px;border-top:1px solid #e8dfd0;padding-top:16px;">
          Track your order using: <strong>${order.orderNumber}</strong><br/>
          Questions? Contact us at ${process.env.MAIL_FROM}.
        </p>
      </div>

      <div style="background:#3d6b45;padding:16px;text-align:center;">
        <p style="color:#c8e6c9;font-size:12px;margin:0;">© ${new Date().getFullYear()} Varnam Organic. All rights reserved.</p>
      </div>
    </div>
    `,
  };
};
