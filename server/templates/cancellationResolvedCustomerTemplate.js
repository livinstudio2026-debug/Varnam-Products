/**
 * Email template sent to the customer when admin resolves their cancellation request.
 *
 * Handles two outcomes:
 *   resolution: 'Approved' — order cancelled, refund initiated if applicable
 *   resolution: 'Rejected' — order continues, adminNote shown if provided
 *
 * Called from: mailService.sendCancellationResolvedToCustomer()
 */
export const cancellationResolvedCustomerTemplate = (order, resolution, isRefund = false) => {
  const isApproved = resolution === 'Approved';

  const approvedBlock = isRefund
    ? `
      <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          💰 <strong>Refund Initiated</strong><br/>
          A full refund of <strong>₹${order.totalPrice.toFixed(2)}</strong> has been initiated
          to your original payment method.<br/><br/>
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

  const rejectedBlock = `
      <div style="background:#fef2f2;border-left:4px solid #b91c1c;border-radius:4px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;">
          <strong>Your order will continue as normal.</strong><br/>
          ${order.cancellationRequest?.adminNote
            ? `Our team reviewed your request and noted: <em>"${order.cancellationRequest.adminNote}"</em>`
            : 'Our team reviewed your request and was unable to cancel the order at this stage.'
          }
        </p>
      </div>
      <p style="color:#555;line-height:1.6;">
        If you have further concerns, please contact us directly at ${process.env.MAIL_FROM}
        and we will do our best to assist you.
      </p>`;

  const subject = isApproved
    ? `Cancellation Approved – ${order.orderNumber} | Varnam Organic`
    : `Cancellation Request Update – ${order.orderNumber} | Varnam Organic`;

  return {
    subject,
    html: `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fffdf8;border:1px solid #e8dfd0;border-radius:8px;overflow:hidden;">
      <div style="background:#3d6b45;padding:28px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:1px;">Varnam Organic</h1>
        <p style="color:#c8e6c9;margin:6px 0 0;font-size:13px;">Pure. Natural. Trusted.</p>
      </div>

      <div style="padding:32px;">
        <h2 style="color:${isApproved ? '#dc2626' : '#3d6b45'};margin-top:0;">
          ${isApproved ? 'Your cancellation request has been approved' : 'Update on your cancellation request'}
        </h2>

        <p style="color:#555;line-height:1.6;">
          Hi ${order.customerName}, we've reviewed your cancellation request for order
          <strong>${order.orderNumber}</strong>.
        </p>

        <div style="background:#f4f0e8;border-radius:6px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 6px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin:0 0 6px;"><strong>Your Reason:</strong> <em>${order.cancellationRequest?.reason}</em></p>
          <p style="margin:0;"><strong>Decision:</strong>
            <span style="color:${isApproved ? '#dc2626' : '#3d6b45'};font-weight:bold;">
              ${isApproved ? '✅ Approved' : '❌ Rejected'}
            </span>
          </p>
        </div>

        ${isApproved ? approvedBlock : rejectedBlock}

        <p style="color:#888;font-size:13px;margin-top:28px;border-top:1px solid #e8dfd0;padding-top:16px;">
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
