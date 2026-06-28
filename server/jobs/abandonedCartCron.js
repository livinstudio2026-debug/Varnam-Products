/**
 * Abandoned Cart Cron Job
 * ───────────────────────
 * Runs every hour and sends reminder emails to users whose carts have been
 * idle without an order being placed.
 *
 * Reminder tiers:
 *   Stage '24h' — cart not updated in ≥24 hours, no reminder sent yet
 *   Stage '3d'  — cart not updated in ≥3 days, only '24h' reminder sent so far
 *
 * Safety guarantees:
 *   1. Cart must have at least one item.
 *   2. User must have placed NO order after the cart was last updated
 *      (checks Order collection — prevents emailing customers who already bought).
 *   3. Reminder stage advances monotonically (24h → 3d, never repeats).
 *   4. Cart.updatedAt is reset on every syncCart mutation, so the clock
 *      restarts if the user touches their cart after a reminder.
 *
 * Registration:
 *   Import and call startAbandonedCartCron() once from server.js after
 *   MongoDB connects.
 */

import cron from 'node-cron';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import transporter from '../config/mail.js';
import { abandonedCart24hTemplate } from '../templates/abandonedCartTemplates.js';
import { abandonedCart3dTemplate } from '../templates/abandonedCartTemplates.js';
import logger from '../utils/logger.js';

// ── Thresholds ───────────────────────────────────────────────────────────────
const HOURS_24 = 24 * 60 * 60 * 1000;   // 24 hours in ms
const DAYS_3   =  3 * 24 * 60 * 60 * 1000; // 3 days in ms

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the user placed at least one order AFTER the cart was
 * last updated. This prevents sending "you forgot your cart" emails to
 * customers who already completed a purchase.
 */
const userPlacedOrderAfterCartUpdate = async (userId, cartUpdatedAt) => {
  const order = await Order.findOne({
    user: userId,
    createdAt: { $gte: cartUpdatedAt },
    // Only consider orders that are not in the abandoned draft state
    orderStatus: { $nin: ['Pending Payment'] },
  }).lean();
  return Boolean(order);
};

/**
 * Sends one abandoned-cart reminder email.
 * Never throws — email failures are logged and swallowed so the cron
 * continues processing the rest of the batch.
 */
const sendReminderEmail = async ({ to, stage, name, items }) => {
  try {
    const template =
      stage === '24h'
        ? abandonedCart24hTemplate({ name, items })
        : abandonedCart3dTemplate({ name, items });

    await transporter.sendMail({
      from: `"Varnam Naturals" <${process.env.MAIL_FROM}>`,
      to,
      subject: template.subject,
      html: template.html,
    });

    logger.info(`[AbandonedCart] Sent ${stage} reminder to ${to}`);
  } catch (error) {
    logger.error(`[AbandonedCart] Failed to send ${stage} reminder to ${to}`, {
      error: error.message,
    });
  }
};

// ── Core cron handler ────────────────────────────────────────────────────────

const runAbandonedCartCheck = async () => {
  const now = Date.now();
  logger.info('[AbandonedCart] Cron started');

  try {
    /**
     * Fetch all carts that:
     *   - Have at least one item
     *   - Have not yet completed the '3d' (final) stage
     *   - Were last updated more than 24 hours ago (minimum threshold)
     *
     * We load the user email via populate to avoid a separate query per cart.
     */
    const carts = await Cart.find({
      'items.0': { $exists: true },                    // non-empty cart
      reminderStage: { $ne: '3d' },                    // haven't sent final reminder yet
      updatedAt: { $lte: new Date(now - HOURS_24) },   // idle ≥ 24 h
    })
      .populate('user', 'name email isBlocked')
      .lean();

    logger.info(`[AbandonedCart] ${carts.length} candidate cart(s) found`);

    for (const cart of carts) {
      // Skip if user was deleted or is blocked
      if (!cart.user || cart.user.isBlocked) continue;

      const { _id: cartId, user, items, reminderStage, updatedAt } = cart;
      const idleMs = now - new Date(updatedAt).getTime();

      // Skip if user already placed an order after the cart was last touched
      const alreadyOrdered = await userPlacedOrderAfterCartUpdate(user._id, updatedAt);
      if (alreadyOrdered) {
        // Clean up reminder state so this cart stops showing up
        await Cart.findByIdAndUpdate(cartId, {
          $set: { reminderStage: '3d', reminderSentAt: new Date() },
        });
        continue;
      }

      // Determine which stage to send next
      let nextStage = null;

      if (!reminderStage && idleMs >= HOURS_24) {
        nextStage = '24h';
      } else if (reminderStage === '24h' && idleMs >= DAYS_3) {
        nextStage = '3d';
      }

      if (!nextStage) continue;

      // Send the email
      await sendReminderEmail({
        to: user.email,
        stage: nextStage,
        name: user.name,
        items,
      });

      // Advance the stage in DB
      await Cart.findByIdAndUpdate(cartId, {
        $set: { reminderStage: nextStage, reminderSentAt: new Date() },
      });
    }

    logger.info('[AbandonedCart] Cron finished');
  } catch (error) {
    logger.error('[AbandonedCart] Cron job error', { error: error.message });
  }
};

// ── Cron registration ────────────────────────────────────────────────────────

/**
 * Starts the abandoned-cart cron.
 * Call this once inside the mongoose.connect().then() block in server.js.
 *
 * Schedule: every hour at minute 0 ("0 * * * *")
 * This means it runs once per hour — low overhead, checks every cart in one pass.
 */
export const startAbandonedCartCron = () => {
  cron.schedule('0 * * * *', runAbandonedCartCheck, {
    timezone: 'Asia/Kolkata',
  });
  logger.info('[AbandonedCart] Cron scheduled — runs every hour (IST)');
};
