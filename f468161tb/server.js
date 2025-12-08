import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './src/routes/userRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import transactionRoutes from './src/routes/transactionRoutes.js';
import { initializeDatabase } from './src/database/init.js';

dotenv.config();

const app = express();
const APP_PORT = process.env.APP_PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Finance Tracker API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      categories: '/api/categories',
      transactions: '/api/transactions'
    }
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
const startServer = async () => {
  // Start server first (don't block on database initialization)
  app.listen(APP_PORT, () => {
    console.log(`Server is running on port ${APP_PORT}`);
    console.log(`API available at http://localhost:${APP_PORT}/api`);
  });

  // Initialize database in background (non-blocking)
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('⚠ Database initialization failed:', error.message);
    console.error('⚠ Server is running but database operations may fail');
    console.error('⚠ Please check your database connection settings');
    // Don't exit - let the server run and retry on first request
  }
};

startServer();