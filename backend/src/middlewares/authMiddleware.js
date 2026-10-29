import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wmc-secure-production-jwt-key-2026-auth';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(403).json({ error: 'No authorization token provided' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err || !decoded || !decoded.id) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
      }

      try {
        // Strict database identity verification: verify account actually exists & is active
        if (decoded.role === 'ADMIN') {
          const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
          if (!admin) {
            return res.status(401).json({ error: 'Unauthorized: Admin account not found' });
          }
        } else if (decoded.role === 'EMPLOYEE') {
          const employee = await prisma.employee.findUnique({ where: { id: decoded.id } });
          if (!employee) {
            return res.status(401).json({ error: 'Unauthorized: Employee account not found' });
          }
          if (employee.status === 'SUSPENDED') {
            return res.status(403).json({ error: 'Employee account suspended' });
          }
        } else {
          // Default: USER role
          const user = await prisma.user.findUnique({ where: { id: decoded.id } });
          if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User account not found' });
          }
        }

        req.user = decoded;
        next();
      } catch (dbErr) {
        return res.status(500).json({ error: 'Authentication verification failure' });
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

export const requireEmployee = (req, res, next) => {
  if (req.user?.role !== 'EMPLOYEE') {
    return res.status(403).json({ error: 'Forbidden: Employee access required' });
  }
  next();
};
