const Transaction = require('../models/Transaction');
const Partner = require('../models/Partner');

// @desc    Get all transactions with optional filters
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, type, category, status, partnerId, search } = req.query;

    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    }

    if (partnerId) {
      filter.partnerRef = partnerId;
    }

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Role-based scoping: Staff can view transactions, but restricted details are handled
    const transactions = await Transaction.find(filter)
      .populate('loggedBy', 'name email role')
      .populate('partnerRef', 'partnerName equitySharePercentage')
      .sort({ transactionDate: -1, createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving transactions', error: error.message });
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private (super_admin, partner, staff)
const createTransaction = async (req, res) => {
  try {
    const { type, amount, category, description, transactionDate, partnerRef } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount, and category are required' });
    }

    // Role restrictions: Staff cannot record partner_draw or capital_injection
    if (req.user.role === 'staff' && ['partner_draw', 'capital_injection'].includes(type)) {
      return res.status(403).json({
        message: 'Staff members are not permitted to log partner draws or capital injections.',
      });
    }

    // Staff entries default to pending or approved based on workflow (let's default to approved for easy usability, or pending if user prefers)
    const status = req.user.role === 'staff' ? 'approved' : 'approved';

    const transaction = await Transaction.create({
      type,
      amount: Number(amount),
      category,
      description: description || '',
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      status,
      loggedBy: req.user._id,
      partnerRef: partnerRef || (req.user.partnerProfileRef ? req.user.partnerProfileRef._id : null),
    });

    // If type is capital_injection and partnerRef exists, update partner's total capital invested
    if (type === 'capital_injection' && transaction.partnerRef) {
      await Partner.findByIdAndUpdate(transaction.partnerRef, {
        $inc: { totalCapitalInvested: Number(amount) },
      });
    }

    // If type is partner_draw and partnerRef exists, update partner's total withdrawn
    if (type === 'partner_draw' && transaction.partnerRef) {
      await Partner.findByIdAndUpdate(transaction.partnerRef, {
        $inc: { totalWithdrawn: Number(amount) },
      });
    }

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('loggedBy', 'name email role')
      .populate('partnerRef', 'partnerName');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Error creating transaction', error: error.message });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private (Restricted to super_admin)
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, transactionDate, status, partnerRef } = req.body;

    const existingTransaction = await Transaction.findById(id);
    if (!existingTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Permission check: Only Super Admin OR the creator of the transaction can edit it
    const isSuperAdmin = req.user.role === 'super_admin';
    const isCreator = existingTransaction.loggedBy.toString() === req.user._id.toString();

    if (!isSuperAdmin && !isCreator) {
      return res.status(403).json({
        message: 'Permission denied: You are only authorized to edit transactions created by your own account.',
      });
    }

    // If changing draw or capital amounts, adjust Partner balances
    if (existingTransaction.type === 'partner_draw' && existingTransaction.partnerRef) {
      await Partner.findByIdAndUpdate(existingTransaction.partnerRef, {
        $inc: { totalWithdrawn: -existingTransaction.amount },
      });
    }
    if (existingTransaction.type === 'capital_injection' && existingTransaction.partnerRef) {
      await Partner.findByIdAndUpdate(existingTransaction.partnerRef, {
        $inc: { totalCapitalInvested: -existingTransaction.amount },
      });
    }

    existingTransaction.type = type || existingTransaction.type;
    existingTransaction.amount = amount !== undefined ? Number(amount) : existingTransaction.amount;
    existingTransaction.category = category || existingTransaction.category;
    existingTransaction.description = description !== undefined ? description : existingTransaction.description;
    existingTransaction.transactionDate = transactionDate ? new Date(transactionDate) : existingTransaction.transactionDate;
    existingTransaction.status = status || existingTransaction.status;
    existingTransaction.partnerRef = partnerRef !== undefined ? partnerRef : existingTransaction.partnerRef;

    await existingTransaction.save();

    // Apply new amounts to partner if applicable
    if (existingTransaction.type === 'partner_draw' && existingTransaction.partnerRef) {
      await Partner.findByIdAndUpdate(existingTransaction.partnerRef, {
        $inc: { totalWithdrawn: existingTransaction.amount },
      });
    }
    if (existingTransaction.type === 'capital_injection' && existingTransaction.partnerRef) {
      await Partner.findByIdAndUpdate(existingTransaction.partnerRef, {
        $inc: { totalCapitalInvested: existingTransaction.amount },
      });
    }

    const updated = await Transaction.findById(id)
      .populate('loggedBy', 'name email role')
      .populate('partnerRef', 'partnerName');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction', error: error.message });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private (Restricted to super_admin)
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Reverse any partner impact
    if (transaction.type === 'partner_draw' && transaction.partnerRef) {
      await Partner.findByIdAndUpdate(transaction.partnerRef, {
        $inc: { totalWithdrawn: -transaction.amount },
      });
    }
    if (transaction.type === 'capital_injection' && transaction.partnerRef) {
      await Partner.findByIdAndUpdate(transaction.partnerRef, {
        $inc: { totalCapitalInvested: -transaction.amount },
      });
    }

    await Transaction.findByIdAndDelete(id);

    res.json({ message: 'Transaction deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
};

// @desc    Update transaction status (approve/reject)
// @route   PATCH /api/transactions/:id/status
// @access  Private (Restricted to super_admin)
const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const transaction = await Transaction.findByIdAndUpdate(id, { status }, { new: true })
      .populate('loggedBy', 'name email role')
      .populate('partnerRef', 'partnerName');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction status', error: error.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  updateTransactionStatus,
};
