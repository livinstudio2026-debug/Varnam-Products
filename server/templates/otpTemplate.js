// server/templates/otpTemplate.js
export const otpTemplate = ({ name, otp, subject }) => ({
  subject: subject || `${otp} is your Varnam Naturals verification code`,
  html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
  </head>
  <body style="margin:0;padding:0;background:#F5F0E8;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:32px 36px;">
        <p style="margin:0 0 6px;font-size:11px;color:rgba(253,246,236,0.55);letter-spacing:0.18em;text-transform:uppercase;">Varnam Naturals</p>
        <h1 style="margin:0;font-size:22px;color:#FDF6EC;font-weight:600;line-height:1.25;">
          ${subject ? 'Verify your email' : 'Reset your password'}
        </h1>
      </div>
      <div style="padding:32px 36px;">
        <p style="margin:0 0 20px;font-size:14px;color:#5C5548;line-height:1.7;">
          Hi ${name || 'there'},
        </p>
        <p style="margin:0 0 28px;font-size:14px;color:#5C5548;line-height:1.7;">
          ${subject
            ? 'Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.'
            : 'We received a request to reset your password. Use the 6-digit code below — it expires in <strong>10 minutes</strong>.'
          }
        </p>
        <div style="background:linear-gradient(135deg,rgba(45,106,79,0.06),rgba(82,183,136,0.08));border:1.5px dashed rgba(45,106,79,0.25);border-radius:14px;padding:28px;text-align:center;margin-bottom:28px;">
          <p style="margin:0 0 6px;font-size:11px;color:#A89F8C;letter-spacing:0.15em;text-transform:uppercase;">Your verification code</p>
          <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:0.22em;color:#2D6A4F;font-family:'Courier New',monospace;">
            ${otp}
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#A89F8C;">Valid for 10 minutes · One-time use only</p>
        </div>
        <p style="margin:0 0 12px;font-size:13px;color:#7A7265;line-height:1.7;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <p style="margin:0;font-size:13px;color:#7A7265;line-height:1.7;">
          Never share this code with anyone.
        </p>
      </div>
      <div style="padding:20px 36px;border-top:1px solid #F0EBE1;background:#FAFAF7;">
        <p style="margin:0;font-size:11px;color:#A89F8C;text-align:center;">
          © ${new Date().getFullYear()} Varnam Naturals · Pure. Organic. Natural.
        </p>
      </div>
    </div>
  </body>
  </html>
  `,
})