
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://washmycar.org.in',
  'https://www.washmycar.org.in',
  'https://emp.washmycar.org.in',
  'https://admin.washmycar.org.in',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
];

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header, such as server-to-server calls.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

// CORS must be registered before API routes.
app.use(cors(corsOptions));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Wash My Car API is running securely',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

import { backfillExistingEmployeeIds, backfillExistingBookingIds } from './utils/idGenerator.js';

app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Server running on 127.0.0.1:${PORT}`);
  try {
    await backfillExistingEmployeeIds();
    await backfillExistingBookingIds();
  } catch (err) {
    console.error('Startup backfill error:', err);
  }
});
