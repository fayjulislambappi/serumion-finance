const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const seedDB = require('./utils/seed');
const User = require('./models/User');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Connect to Database and auto-seed if clean launch
connectDB().then(async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Running initial auto-seed script...');
      await seedDB();
    } else {
      console.log(`ℹ️ Database already contains ${userCount} users. Ready!`);
    }
  } catch (err) {
    console.error('Error checking user count during startup:', err.message);
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/equity', require('./routes/equityRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Serumion Financial Management Server',
    timestamp: new Date(),
  });
});

// Serve static React production build when deployed
const possibleClientPaths = [
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, '../../client/dist'),
  path.join(process.cwd(), 'client/dist'),
  path.join(process.cwd(), '../client/dist'),
];

const clientBuildPath = possibleClientPaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (clientBuildPath) {
  console.log(`🌐 Serving static client files from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Client build index.html not found');
    }
  });
} else {
  console.warn('⚠️ Client production build directory (client/dist) not found.');
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✨ Serumion Financial API Server running on port ${PORT}`);
});
