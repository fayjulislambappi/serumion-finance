const express = require('express');
const router = express.Router();
const {
  getIncomeStatement,
  getBalanceSheet,
  getPartnerDrawLedgers,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/income-statement', authorize('super_admin', 'partner'), getIncomeStatement);
router.get('/balance-sheet', authorize('super_admin', 'partner'), getBalanceSheet);
router.get('/partner-draws', authorize('super_admin', 'partner'), getPartnerDrawLedgers);

module.exports = router;
