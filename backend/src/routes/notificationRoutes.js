import express from 'express';
import { getVapidKey, subscribePush, unsubscribePush } from '../controllers/notificationController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-mocking';

// Optional token extractor middleware
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        req.user = decoded;
      }
      next();
    });
  } else {
    next();
  }
};

router.get('/vapid-public-key', getVapidKey);
router.post('/subscribe', optionalAuth, subscribePush);
router.post('/unsubscribe', unsubscribePush);

export default router;
