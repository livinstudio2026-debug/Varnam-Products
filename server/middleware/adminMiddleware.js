import { ROLES } from '../constants/roles.js';

const admin = (req, res, next) => {
  if (req.user && req.user.role === ROLES.ADMIN) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Management credentials required.'
    });
  }
};

export { admin };
