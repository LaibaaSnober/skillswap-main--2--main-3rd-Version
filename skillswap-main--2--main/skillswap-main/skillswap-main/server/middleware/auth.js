const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ADMIN CASE
    if (decoded.isAdmin) {
      req.user = {
        _id: 'admin',
        name: 'Admin',
        email: process.env.ADMIN_ID,
        isAdmin: true,
        isPublic: false,
        profilePhoto: null,
      };
      return next();
    }

    // NORMAL USER
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found or token invalid' });
    }

    req.user = user; // IMPORTANT
    next();

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.isAdmin !== true) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = Object.assign(auth, { requireAdmin });