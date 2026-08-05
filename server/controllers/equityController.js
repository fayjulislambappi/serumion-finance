const Partner = require('../models/Partner');
const Transaction = require('../models/Transaction');
const ProfitDistribution = require('../models/ProfitDistribution');
const User = require('../models/User');

// @desc    Get live equity and profit distribution summary (tailored for current user)
// @route   GET /api/equity/summary
// @access  Private (super_admin, partner)
const getEquitySummary = async (req, res) => {
  try {
    // 1. Calculate Gross Sales (income_sale) & Operating Expenses (operating_expense)
    const incomeAgg = await Transaction.aggregate([
      { $match: { type: 'income_sale', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const expenseAgg = await Transaction.aggregate([
      { $match: { type: 'operating_expense', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const capitalAgg = await Transaction.aggregate([
      { $match: { type: 'capital_injection', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const grossSales = incomeAgg.length > 0 ? incomeAgg[0].total : 0;
    const operatingExpenses = expenseAgg.length > 0 ? expenseAgg[0].total : 0;
    const netBusinessProfit = grossSales - operatingExpenses;

    const totalCapitalFromTxs = capitalAgg.length > 0 ? capitalAgg[0].total : 0;

    // Fetch partners
    const partners = await Partner.find().populate('userId', 'name email role');

    let sumPartnerCapital = 0;
    let sumPartnerWithdrawn = 0;

    const partnerSummaries = partners.map((partner) => {
      const equityPct = partner.equitySharePercentage || 0;
      const scaleFactor = partner.profitScaleFactor !== undefined ? partner.profitScaleFactor : 1.0;
      const capitalInvested = partner.totalCapitalInvested || 0;
      const withdrawn = partner.totalWithdrawn || 0;

      sumPartnerCapital += capitalInvested;
      sumPartnerWithdrawn += withdrawn;

      const baseProfitShare = Math.max(0, netBusinessProfit) * (equityPct / 100);
      const adjustedProfitShare = baseProfitShare * scaleFactor;
      const withdrawableAmount = adjustedProfitShare - withdrawn;

      return {
        _id: partner._id,
        userId: partner.userId,
        partnerName: partner.partnerName,
        equitySharePercentage: equityPct,
        profitScaleFactor: scaleFactor,
        totalCapitalInvested: capitalInvested,
        totalWithdrawn: withdrawn,
        baseProfitShare: Number(baseProfitShare.toFixed(2)),
        adjustedProfitShare: Number(adjustedProfitShare.toFixed(2)),
        liveWithdrawableAmount: Number(withdrawableAmount.toFixed(2)),
        isCurrentUser: req.user.partnerProfileRef && req.user.partnerProfileRef._id
          ? req.user.partnerProfileRef._id.toString() === partner._id.toString()
          : false,
      };
    });

    const totalCapitalInvested = Math.max(totalCapitalFromTxs, sumPartnerCapital);
    const totalOwnerEquity = totalCapitalInvested + netBusinessProfit - sumPartnerWithdrawn;

    // If partner user, also extract their individual record directly
    let myPartnerProfile = null;
    if (req.user.role === 'partner' && req.user.partnerProfileRef) {
      myPartnerProfile = partnerSummaries.find(
        (p) => p._id.toString() === req.user.partnerProfileRef._id.toString()
      );
    }

    res.json({
      metrics: {
        grossSales: Number(grossSales.toFixed(2)),
        operatingExpenses: Number(operatingExpenses.toFixed(2)),
        netBusinessProfit: Number(netBusinessProfit.toFixed(2)),
        totalCapitalInvested: Number(totalCapitalInvested.toFixed(2)),
        totalWithdrawn: Number(sumPartnerWithdrawn.toFixed(2)),
        totalOwnerEquity: Number(totalOwnerEquity.toFixed(2)),
      },
      partners: partnerSummaries,
      myPartnerProfile,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error computing equity summary', error: error.message });
  }
};

// @desc    Update partner profit scale factor
// @route   PUT /api/equity/partner-scale
// @access  Private (Restricted to super_admin)
const updatePartnerScaleFactor = async (req, res) => {
  try {
    const { partnerId, profitScaleFactor, equitySharePercentage } = req.body;

    if (!partnerId) {
      return res.status(400).json({ message: 'Partner ID is required' });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    if (profitScaleFactor !== undefined) {
      if (profitScaleFactor < 0) {
        return res.status(400).json({ message: 'Profit scale factor must be 0 or greater' });
      }
      partner.profitScaleFactor = Number(profitScaleFactor);
    }

    if (equitySharePercentage !== undefined) {
      if (equitySharePercentage < 0 || equitySharePercentage > 100) {
        return res.status(400).json({ message: 'Equity percentage must be between 0 and 100' });
      }
      partner.equitySharePercentage = Number(equitySharePercentage);
    }

    await partner.save();

    res.json({ message: 'Partner equity rules updated successfully', partner });
  } catch (error) {
    res.status(500).json({ message: 'Error updating partner scale factor', error: error.message });
  }
};

// @desc    Process payout log for partner
// @route   POST /api/equity/payout
// @access  Private (Restricted to super_admin)
const processPayout = async (req, res) => {
  try {
    const { partnerId, amountPaid, notes } = req.body;

    if (!partnerId || !amountPaid || amountPaid <= 0) {
      return res.status(400).json({ message: 'Valid partnerId and positive amountPaid are required' });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const payout = await ProfitDistribution.create({
      partnerId: partner._id,
      scaleFactorAtPayout: partner.profitScaleFactor,
      amountPaid: Number(amountPaid),
      payoutDate: new Date(),
      approvedBy: req.user._id,
      notes: notes || `Dividend Payout approved by Super Admin`,
    });

    await Transaction.create({
      type: 'partner_draw',
      amount: Number(amountPaid),
      category: 'Partner Dividend Payout',
      description: notes || `Dividend Payout to ${partner.partnerName}`,
      transactionDate: new Date(),
      status: 'approved',
      loggedBy: req.user._id,
      partnerRef: partner._id,
    });

    partner.totalWithdrawn += Number(amountPaid);
    await partner.save();

    const populatedPayout = await ProfitDistribution.findById(payout._id)
      .populate('partnerId', 'partnerName equitySharePercentage')
      .populate('approvedBy', 'name email');

    res.status(201).json({ message: 'Payout approved & logged successfully', payout: populatedPayout });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payout', error: error.message });
  }
};

// @desc    Get profit distribution payout logs (filtered for partners to view their own payouts)
// @route   GET /api/equity/payouts
// @access  Private (super_admin, partner)
const getPayoutLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'partner' && req.user.partnerProfileRef) {
      filter.partnerId = req.user.partnerProfileRef._id;
    }

    const payouts = await ProfitDistribution.find(filter)
      .populate('partnerId', 'partnerName equitySharePercentage')
      .populate('approvedBy', 'name email')
      .sort({ payoutDate: -1 });

    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payout logs', error: error.message });
  }
};

module.exports = {
  getEquitySummary,
  updatePartnerScaleFactor,
  processPayout,
  getPayoutLogs,
};
