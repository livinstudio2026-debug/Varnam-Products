/**
 * Email sent to the customer when Razorpay fires refund.processed —
 * confirming the refund has actually completed and money is on its way.
 *
 * This is different from the cancellation email which says "refund initiated".
 * This one says "refund is done — check your account".
 *
 * Called from: mailService.sendRefundConfirmedEmail()
 */
export const orderRefundConfirmedTemplate = (order) => {
  return {
    subject: `Refund Completed – ${order.orderNumber} | Varnam Organic`,
    html: `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fffdf8;border:1px solid #e8dfd0;border-radius:8px;overflow:hidden;">
      <div style="background:#3d6b45;padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">Varnam Organic</h1>
        <p style="color:#c8e6c9;margin:6px 0 0;font-size:13px;">Pure. Natural. Trusted.</p>
      </div>

      <div style="padding:32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">✅</div>
        <h2 style="color:#3d6b45;margin-top:0;">Your refund has been processed!</h2>
        <p style="color:#555;line-height:1.6;max-width:440px;margin:0 auto;">
          Hi ${order.customerName}, your refund for order
          <strong>${order.orderNumber}</strong> has been successfully processed
          by Razorpay. The amount will reflect in your account shortly.
        </p>

        <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:16px 20px;margin:24px auto;text-align:left;max-width:380px;">
          <p style="margin:0 0 6px;color:#166534;"><strong>Refund Amount:</strong> ₹${order.totalPrice.toFixed(2)}</p>
          <p style="margin:0 0 6px;color:#166534;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin:0;color:#166534;"><strong>Status:</strong> ✅ Refund Completed</p>
        </div>

        <div style="background:#f4f0e8;border-radius:6px;padding:14px 18px;margin:16px auto;max-width:380px;text-align:left;">
          <p style="margin:0 0 4px;font-size:13px;color:#666;"><strong>When will I see the money?</strong></p>
          <p style="margin:0;font-size:13px;color:#777;line-height:1.7;">
            UPI → Usually already in your account<br/>
            Debit / Credit Card → 1–3 business days<br/>
            Net Banking → 1–3 business days
          </p>
        </div>

        <p style="color:#555;line-height:1.6;margin-top:20px;max-width:440px;margin-left:auto;margin-right:auto;">
          If you don't see the refund after the expected time, please contact
          your bank with the order number <strong>${order.orderNumber}</strong> and they'll
          be able to track it on their end.
        </p>

        <p style="color:#888;font-size:13px;margin-top:28px;border-top:1px solid #e8dfd0;padding-top:16px;">
          Questions? Contact us at ${process.env.MAIL_FROM}
        </p>
      </div>

      <div style="background:#3d6b45;padding:16px;text-align:center;">
        <p style="color:#c8e6c9;font-size:12px;margin:0;">© ${new Date().getFullYear()} Varnam Organic. All rights reserved.</p>
      </div>
    </div>
    `,
  };
};
