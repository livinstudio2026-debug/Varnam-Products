/**
 * Email template sent to the customer when order status transitions to 'Delivered'.
 * Triggered automatically from updateOrderStatus in orderController.js.
 */
export const orderDeliveredTemplate = (order) => {
  return {
    subject: `Order Delivered! We hope you love it – ${order.orderNumber} | Varnam Organic`,
    html: `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fffdf8;border:1px solid #e8dfd0;border-radius:8px;overflow:hidden;">
      <div style="background:#3d6b45;padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">Varnam Organic</h1>
        <p style="color:#c8e6c9;margin:6px 0 0;font-size:13px;">Pure. Natural. Trusted.</p>
      </div>

      <div style="padding:32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">🌿</div>
        <h2 style="color:#3d6b45;margin-top:0;">Your order has been delivered!</h2>
        <p style="color:#555;line-height:1.6;max-width:440px;margin:0 auto;">
          Hi ${order.customerName}, your Varnam Organic order <strong>${order.orderNumber}</strong> has been
          successfully delivered. We hope you enjoy our natural products!
        </p>

        <div style="background:#f4f0e8;border-radius:6px;padding:16px 20px;margin:24px auto;text-align:left;max-width:360px;">
          <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin:0 0 6px;"><strong>Status:</strong> <span style="color:#3d6b45;font-weight:bold;">✅ Delivered</span></p>
          <p style="margin:0;"><strong>Total Paid:</strong> ₹${order.totalPrice.toFixed(2)}</p>
        </div>

        <p style="color:#555;line-height:1.6;margin-top:16px;max-width:440px;margin-left:auto;margin-right:auto;">
          Experience the purity of nature with every use. If you have any concerns about your order,
          please reach out to us — we're here to help.
        </p>

        <div style="margin-top:24px;">
          <p style="color:#3d6b45;font-weight:bold;font-size:15px;margin-bottom:4px;">Loved your order?</p>
          <p style="color:#777;font-size:13px;margin:0;">
            Share your experience with friends and family. Every referral helps us grow and bring
            more natural goodness to more homes.
          </p>
        </div>

        <p style="color:#888;font-size:13px;margin-top:28px;border-top:1px solid #e8dfd0;padding-top:16px;">
          Questions or concerns? Contact us at ${process.env.MAIL_FROM}.
        </p>
      </div>

      <div style="background:#3d6b45;padding:16px;text-align:center;">
        <p style="color:#c8e6c9;font-size:12px;margin:0;">© ${new Date().getFullYear()} Varnam Organic. All rights reserved.</p>
      </div>
    </div>
    `,
  };
};
