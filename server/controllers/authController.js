import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { ROLES } from '../constants/roles.js';
import crypto from 'crypto';  // add this import at the very top of the file
import bcrypt from 'bcryptjs';

// Internal helper — hides raw error.message in production.
// authController handles auth flows where error details (e.g. bcrypt internals,
// DB connection strings) must never be surfaced to the client.
const internalError = (res, error) => {
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: ROLES.CUSTOMER,
    });

    if (user) {
      generateToken(res, user._id);
      res.status(201).json({
        success: true,
        data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
      });
    }
  } catch (error) {
    internalError(res, error);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== ROLES.CUSTOMER) {
      return res.status(401).json({ success: false, message: 'Invalid customer credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid customer credentials' });
    }

    generateToken(res, user._id);
    res.status(200).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    internalError(res, error);
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== ROLES.ADMIN) {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid credentials.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'This admin account has been suspended' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid credentials.' });
    }

    generateToken(res, user._id);
    res.status(200).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    internalError(res, error);
  }
};

const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      expires: new Date(0),
    });
    res.status(200).json({ success: true, message: 'Successfully logged out' });
  } catch (error) {
    internalError(res, error);
  }
};

const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    internalError(res, error);
  }
};

// ── FORGOT PASSWORD — sends OTP to email ──────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // 1. Define the uniform response helper to prevent email enumeration
    const sendGenericResponse = () =>
      res.status(200).json({ 
        success: true, 
        message: 'If that email is registered, an OTP has been sent.' 
      });

    // 2. Search for the user (No role or block restrictions here anymore)
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    // 3. SILENT EXIT: If user doesn't exist, exit early with the generic message.
    // The client/attacker will never know the email wasn't found.
    if (!user) {
      return sendGenericResponse();
    }

    // 4. Generate 6-digit OTP (Only runs if user exists)
    const otp    = String(crypto.randomInt(100000, 999999));
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(otp, salt);

    user.resetOtp        = hashed;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetOtpUsed    = false;
    await user.save({ validateBeforeSave: false });

    // 5. Send email dynamically
    const { otpTemplate } = await import('../templates/otpTemplate.js');
    const template = otpTemplate({ name: user.name, otp });
    const { default: transporter } = await import('../config/mail.js');
    
    await transporter.sendMail({
      from: `"Varnam Organic" <${process.env.MAIL_FROM}>`,
      to: user.email,
      ...template,
    });

    // 6. Valid users get the exact same response as unregistered users
    return sendGenericResponse();

  } catch (error) {
    internalError(res, error);
  }
};

// ── RESET PASSWORD — verify OTP + set new password ───────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select('+password +resetOtp +resetOtpExpires +resetOtpUsed');

    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    if (!user.resetOtp || !user.resetOtpExpires)
      return res.status(400).json({ success: false, message: 'No OTP was requested. Please request a new one.' });

    if (user.resetOtpUsed)
      return res.status(400).json({ success: false, message: 'This OTP has already been used. Please request a new one.' });

    if (user.resetOtpExpires < new Date())
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

    const isMatch = await bcrypt.compare(String(otp).trim(), user.resetOtp);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });

    // All good — update password and clear OTP fields
    user.password        = newPassword;   // pre-save hook hashes it
    user.resetOtp        = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpUsed    = true;          // one-time use guard (cleared on next forgot-password request)
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    internalError(res, error);
  }
};

// ── In-memory OTP store for email verification during registration ─────────
// Map<email, { otpHash, expiresAt }>
// Simple in-memory — fine for a single-server setup.
// Automatically garbage-collected when process restarts (no stale entries).
const pendingVerifications = new Map();

// ── SEND REGISTRATION OTP ─────────────────────────────────────────────────
const sendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalised = email.trim().toLowerCase();

    // Block if email already registered
    const exists = await User.findOne({ email: normalised });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Generate & hash OTP
    const otp    = String(crypto.randomInt(100000, 999999));
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(otp, salt);

    pendingVerifications.set(normalised, {
      otpHash:   hashed,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send email
    const { otpTemplate } = await import('../templates/otpTemplate.js');
    const template = otpTemplate({ name: 'there', otp, subject: `${otp} — Verify your Varnam Naturals email` });
    const { default: transporter } = await import('../config/mail.js');
    await transporter.sendMail({
      from: `"Varnam Organic" <${process.env.MAIL_FROM}>`,
      to:   normalised,
      subject: template.subject,
      html:    template.html,
    });

    return res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    internalError(res, error);
  }
};

// ── VERIFY REGISTRATION OTP ───────────────────────────────────────────────
const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const normalised = email.trim().toLowerCase();
    const pending    = pendingVerifications.get(normalised);

    if (!pending)                        return res.status(400).json({ success: false, message: 'No OTP requested for this email. Please request a new one.' });
    if (Date.now() > pending.expiresAt)  { pendingVerifications.delete(normalised); return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' }); }

    const isMatch = await bcrypt.compare(String(otp).trim(), pending.otpHash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });

    // OTP verified — delete from map so it can't be reused
    pendingVerifications.delete(normalised);

    return res.status(200).json({ success: true, message: 'Email verified.' });
  } catch (error) {
    internalError(res, error);
  }
};

// ── In-memory OTP store for guest checkout email verification ─────────────
// Separate from pendingVerifications so guest OTPs never clash with register OTPs.
// Map<email, { otpHash, expiresAt }>
const guestCheckoutOtps = new Map();

// ── SEND GUEST CHECKOUT OTP ───────────────────────────────────────────────
// Works for ANY email — registered users or new guests alike.
// Does NOT create an account; only proves the guest owns the email address.
const sendGuestCheckoutOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalised = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalised)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Generate & hash OTP
    const otp    = String(crypto.randomInt(100000, 999999));
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(otp, salt);

    guestCheckoutOtps.set(normalised, {
      otpHash:   hashed,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send email using the existing OTP template
    const { otpTemplate } = await import('../templates/otpTemplate.js');
    const template = otpTemplate({
      name: 'there',
      otp,
      subject: `${otp} — Verify your email to place order`,
    });
    const { default: transporter } = await import('../config/mail.js');
    await transporter.sendMail({
      from: `"Varnam Organic" <${process.env.MAIL_FROM}>`,
      to:   normalised,
      subject: template.subject,
      html:    template.html,
    });

    return res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    internalError(res, error);
  }
};

// ── VERIFY GUEST CHECKOUT OTP ─────────────────────────────────────────────
const verifyGuestCheckoutOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const normalised = email.trim().toLowerCase();
    const pending    = guestCheckoutOtps.get(normalised);

    if (!pending) {
      return res.status(400).json({ success: false, message: 'No OTP requested for this email. Please request a new one.' });
    }
    if (Date.now() > pending.expiresAt) {
      guestCheckoutOtps.delete(normalised);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(String(otp).trim(), pending.otpHash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });

    // Verified — remove so it can't be reused
    guestCheckoutOtps.delete(normalised);

    return res.status(200).json({ success: true, message: 'Email verified.' });
  } catch (error) {
    internalError(res, error);
  }
};

export { registerUser, loginUser, loginAdmin, logout, getMe, forgotPassword, resetPassword, sendRegisterOtp, verifyRegisterOtp, sendGuestCheckoutOtp, verifyGuestCheckoutOtp };