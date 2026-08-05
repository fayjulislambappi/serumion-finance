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

// Serve static React production build
const clientBuildPath = path.resolve(__dirname, '../client/dist');
console.log(`🌐 Static client build path: ${clientBuildPath} (Exists: ${fs.existsSync(clientBuildPath)})`);

app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Serumion Finance - Server Active</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f172a; border: 1px solid #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; max-width: 400px; }
            h1 { color: #0ea5e9; font-size: 1.5rem; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 0.875rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Serumion Finance API</h1>
            <p>Backend API Server is live on Render. Client build compiling...</p>
          </div>
        </body>
      </html>
    `);
  }
});

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
