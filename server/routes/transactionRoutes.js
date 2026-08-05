const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  updateTransactionStatus,
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .put(updateTransaction) // Controller enforces super_admin OR creator of the transaction
  .delete(authorize('super_admin'), deleteTransaction); // Strictly Super Admin only

router.route('/:id/status')
  .patch(authorize('super_admin'), updateTransactionStatus);

module.exports = router;
