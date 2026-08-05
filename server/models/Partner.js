const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    partnerName: {
      type: String,
      required: [true, 'Partner Name is required'],
      trim: true,
    },
    equitySharePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    profitScaleFactor: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    totalCapitalInvested: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Partner', partnerSchema);
