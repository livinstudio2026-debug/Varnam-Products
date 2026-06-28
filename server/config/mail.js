import nodemailer from 'nodemailer';

/**
 * Reusable Nodemailer transporter.
 * Uses SMTP credentials from environment variables.
 * Compatible with: Gmail, Brevo, Zoho, any SMTP provider.
 *
 * For Gmail: enable App Passwords (not your account password).
 * For Brevo (recommended for production): use SMTP relay credentials from dashboard.
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: Number(process.env.MAIL_PORT) === 465, // true for port 465, false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export default transporter;
