const mongoose = require('mongoose');

const profitDistributionSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    scaleFactorAtPayout: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0.01,
    },
    payoutDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProfitDistribution', profitDistributionSchema);
