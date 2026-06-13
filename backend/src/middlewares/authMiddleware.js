import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-mocking';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Require Admin Role' });
  next();
};

export const requireEmployee = (req, res, next) => {
  if (req.user.role !== 'EMPLOYEE') return res.status(403).json({ error: 'Require Employee Role' });
  next();
};
