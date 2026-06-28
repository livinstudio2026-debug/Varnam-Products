import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    // No token? No problem. Pass processing right along to checkout logic as a guest.
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    // Block suspended accounts even on optional routes (e.g. order placement).
    // Without this, a blocked customer can still place orders as long as their cookie is valid.
    if (user && user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    // If the token is broken/expired, don't crash. Just fall back and process as a guest.
    next();
  }
};