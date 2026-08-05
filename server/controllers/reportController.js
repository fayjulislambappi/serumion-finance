const Transaction = require('../models/Transaction');
const Partner = require('../models/Partner');
const ProfitDistribution = require('../models/ProfitDistribution');

// @desc    Get Income Statement (P&L) Report data
// @route   GET /api/reports/income-statement
// @access  Private (super_admin, partner)
const getIncomeStatement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter = { status: 'approved' };
    if (startDate || endDate) {
      matchFilter.transactionDate = {};
      if (startDate) matchFilter.transactionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.transactionDate.$lte = end;
      }
    }

    const transactions = await Transaction.find(matchFilter).sort({ transactionDate: 1 });

    let grossSales = 0;
    let operatingExpenses = 0;
    const salesCategories = {};
    const expenseCategories = {};

    transactions.forEach((tx) => {
      if (tx.type === 'income_sale') {
        grossSales += tx.amount;
        salesCategories[tx.category] = (salesCategories[tx.category] || 0) + tx.amount;
      } else if (tx.type === 'operating_expense') {
        operatingExpenses += tx.amount;
        expenseCategories[tx.category] = (expenseCategories[tx.category] || 0) + tx.amount;
      }
    });

    const netOperatingProfit = grossSales - operatingExpenses;

    res.json({
      period: {
        startDate: startDate || 'All Time',
        endDate: endDate || 'Present',
      },
      revenue: {
        totalGrossSales: Number(grossSales.toFixed(2)),
        byCategory: Object.entries(salesCategories).map(([category, amount]) => ({
          category,
          amount: Number(amount.toFixed(2)),
        })),
      },
      expenses: {
        totalOperatingExpenses: Number(operatingExpenses.toFixed(2)),
        byCategory: Object.entries(expenseCategories).map(([category, amount]) => ({
          category,
          amount: Number(amount.toFixed(2)),
        })),
      },
      netOperatingProfit: Number(netOperatingProfit.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating Income Statement', error: error.message });
  }
};

// @desc    Get Balance Sheet Report data
// @route   GET /api/reports/balance-sheet
// @access  Private (super_admin, partner)
const getBalanceSheet = async (req, res) => {
  try {
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
    const netProfit = grossSales - operatingExpenses;
    const totalCapital = capitalAgg.length > 0 ? capitalAgg[0].total : 0;

    const partners = await Partner.find().populate('userId', 'name');

    let totalPartnerDraws = 0;
    const partnerEquityBreakdown = partners.map((p) => {
      totalPartnerDraws += p.totalWithdrawn || 0;
      const baseShare = Math.max(0, netProfit) * (p.equitySharePercentage / 100);
      const scaledShare = baseShare * (p.profitScaleFactor !== undefined ? p.profitScaleFactor : 1);
      const endingBalance = p.totalCapitalInvested + scaledShare - p.totalWithdrawn;

      return {
        partnerId: p._id,
        name: p.partnerName,
        equityPct: p.equitySharePercentage,
        capitalInvested: p.totalCapitalInvested,
        netProfitShare: Number(scaledShare.toFixed(2)),
        totalWithdrawn: p.totalWithdrawn,
        endingEquity: Number(endingBalance.toFixed(2)),
      };
    });

    const cashOnHand = totalCapital + netProfit - totalPartnerDraws;
    const totalAssets = cashOnHand;
    const totalLiabilities = 0; // Standard equity model
    const totalEquity = totalCapital + netProfit - totalPartnerDraws;

    res.json({
      asOfDate: new Date(),
      assets: {
        cashAndEquivalents: Number(cashOnHand.toFixed(2)),
        totalAssets: Number(totalAssets.toFixed(2)),
      },
      liabilities: {
        accountsPayable: 0,
        totalLiabilities: Number(totalLiabilities.toFixed(2)),
      },
      equity: {
        initialCapital: Number(totalCapital.toFixed(2)),
        retainedEarnings: Number(netProfit.toFixed(2)),
        lessPartnerDraws: Number(totalPartnerDraws.toFixed(2)),
        totalEquity: Number(totalEquity.toFixed(2)),
        partnerBreakdown: partnerEquityBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating Balance Sheet', error: error.message });
  }
};

// @desc    Get Partner Draw Ledgers Report
// @route   GET /api/reports/partner-draws
// @access  Private (super_admin, partner)
const getPartnerDrawLedgers = async (req, res) => {
  try {
    const draws = await Transaction.find({ type: 'partner_draw', status: 'approved' })
      .populate('partnerRef', 'partnerName equitySharePercentage')
      .populate('loggedBy', 'name email')
      .sort({ transactionDate: -1 });

    const payouts = await ProfitDistribution.find()
      .populate('partnerId', 'partnerName equitySharePercentage')
      .populate('approvedBy', 'name email')
      .sort({ payoutDate: -1 });

    res.json({ draws, payouts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching partner draw ledgers', error: error.message });
  }
};

module.exports = {
  getIncomeStatement,
  getBalanceSheet,
  getPartnerDrawLedgers,
};
