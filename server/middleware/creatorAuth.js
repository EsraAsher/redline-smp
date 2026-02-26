import jwt from 'jsonwebtoken';
import ReferralPartner from '../models/ReferralPartner.js';

/**
 * Middleware to protect creator dashboard routes.
 * Verifies a JWT issued during Discord OAuth login.
 * Attaches the ReferralPartner document to req.creator.
 */
const creatorAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token must have been issued for a creator (not admin)
    if (decoded.type !== 'creator') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const creator = await ReferralPartner.findById(decoded.id);
    if (!creator) {
      return res.status(401).json({ message: 'Creator not found' });
    }

    req.creator = creator;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default creatorAuthMiddleware;
