import express from 'express';
import {
  registerUser,
  loginUser,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  sendRegisterOtp,
  verifyRegisterOtp,
  sendGuestCheckoutOtp,
  verifyGuestCheckoutOtp,
} from '../controllers/authController.js';
import { protect }                           from '../middleware/authMiddleware.js';
import { registerValidator, loginValidator } from '../validators/authValidator.js';

const router = express.Router();

router.post('/register',             registerValidator, registerUser);
router.post('/login',                loginValidator,    loginUser);
router.post('/logout',               protect,           logout);
router.get('/me',                    protect,           getMe);
router.post('/forgot-password',                         forgotPassword);
router.post('/reset-password',                          resetPassword);
router.post('/send-register-otp',                       sendRegisterOtp);
router.post('/verify-register-otp',                     verifyRegisterOtp);
router.post('/send-guest-checkout-otp',                 sendGuestCheckoutOtp);
router.post('/verify-guest-checkout-otp',               verifyGuestCheckoutOtp);

export default router;