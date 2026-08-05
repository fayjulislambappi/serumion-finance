const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Transaction = require('../models/Transaction');
const ProfitDistribution = require('../models/ProfitDistribution');

const hashPassword = async (pwd) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pwd, salt);
};

const seedDB = async () => {
  try {
    console.log('🧹 Clearing all test data from database collections...');
    await User.deleteMany({});
    await Partner.deleteMany({});
    await Transaction.deleteMany({});
    await ProfitDistribution.deleteMany({});

    console.log('🔑 Hashing Master Super Admin password...');
    const adminHash = await hashPassword('Admin#Serumion2026');

    console.log('👑 Creating 1 Master Super Admin Account...');
    await User.create({
      name: 'Serumion Master Admin',
      email: 'admin@serumion.com',
      passwordHash: adminHash,
      role: 'super_admin',
    });

    console.log('✨ Clean database initialized! Only 1 Master Super Admin exists. Super Admin can add real data.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};

module.exports = seedDB;

if (require.main === module) {
  const connectDB = require('../config/db');
  require('dotenv').config();
  connectDB().then(async () => {
    await seedDB();
    process.exit(0);
  });
}
