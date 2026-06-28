/**
 * Email templates for abandoned-cart reminders.
 *
 * abandonedCart24hTemplate — sent 24 hours after last cart update
 * abandonedCart3dTemplate  — sent 3 days after last cart update
 *
 * Both follow the existing Varnam brand: dark forest green header,
 * cream body, amber/gold accents, clean table layout.
 */

const itemRows = (items) =>
  items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;font-size:14px;color:#3D3530;">
          ${item.name}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;text-align:center;font-size:14px;color:#3D3530;">
          ${item.quantity}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0ece4;text-align:right;font-size:14px;color:#3D3530;">
          ₹${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

const cartTotal = (items) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);

/**
 * Shared HTML wrapper — keeps both templates visually consistent.
 */
const wrapTemplate = ({ name, headline, subtext, ctaText, items, footerNote }) => ({
  html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
  </head>
  <body style="margin:0;padding:0;background:#F5F0E8;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:32px 36px;">
        <p style="margin:0 0 6px;font-size:11px;color:rgba(253,246,236,0.55);letter-spacing:0.18em;text-transform:uppercase;">Varnam Naturals</p>
        <h1 style="margin:0;font-size:22px;color:#FDF6EC;font-weight:600;line-height:1.3;">${headline}</h1>
      </div>

      <!-- Body -->
      <div style="padding:32px 36px;">
        <p style="margin:0 0 20px;font-size:14px;color:#5C5548;line-height:1.7;">Hi ${name || 'there'},</p>
        <p style="margin:0 0 28px;font-size:14px;color:#5C5548;line-height:1.7;">${subtext}</p>

        <!-- Items table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#F5F0E8;">
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#A89F8C;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Item</th>
              <th style="padding:10px 8px;text-align:center;font-size:12px;color:#A89F8C;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Qty</th>
              <th style="padding:10px 8px;text-align:right;font-size:12px;color:#A89F8C;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows(items)}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px 8px;font-weight:700;font-size:14px;color:#1B4332;">Total</td>
              <td style="padding:12px 8px;text-align:right;font-weight:700;font-size:14px;color:#1B4332;">₹${cartTotal(items)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- CTA -->
        <div style="text-align:center;margin:28px 0;">
          <a href="${process.env.CLIENT_URL}/cart"
             style="display:inline-block;background:linear-gradient(135deg,#1B4332,#2D6A4F);color:#FDF6EC;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:600;letter-spacing:0.03em;">
            ${ctaText}
          </a>
        </div>

        <!-- Footer note -->
        <p style="margin:24px 0 0;font-size:12px;color:#A89F8C;text-align:center;line-height:1.6;">${footerNote}</p>
      </div>

      <!-- Bottom bar -->
      <div style="background:#F5F0E8;padding:16px 36px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#A89F8C;">
          © ${new Date().getFullYear()} Varnam Naturals. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>`,
});

/**
 * 24-hour reminder.
 * Tone: warm nudge — "you left something behind."
 */
export const abandonedCart24hTemplate = ({ name, items }) => ({
  subject: '⏰ You left something in your cart, ' + (name?.split(' ')[0] || 'there') + '!',
  ...wrapTemplate({
    name,
    items,
    headline: 'Your cart is waiting for you 🌿',
    subtext:
      'It looks like you added some lovely items to your cart but didn\'t complete your purchase. Your cart is still saved — pick up right where you left off.',
    ctaText: 'Complete My Purchase →',
    footerNote:
      'Not interested? No worries — your cart will stay saved for a few more days. You can unsubscribe from marketing emails in your account settings.',
  }),
});

/**
 * 3-day reminder.
 * Tone: gentle urgency — "items may sell out."
 */
export const abandonedCart3dTemplate = ({ name, items }) => ({
  subject: '🛒 Complete your purchase before it\'s gone!',
  ...wrapTemplate({
    name,
    items,
    headline: 'Don\'t let these go! 🌱',
    subtext:
      'Your cart has been sitting for a few days. We\'d hate for these natural goodies to sell out before you grab them. Stock is limited — complete your order today.',
    ctaText: 'Claim My Cart Now →',
    footerNote:
      'This is our final reminder about your cart. You can unsubscribe from marketing emails in your account settings.',
  }),
});
