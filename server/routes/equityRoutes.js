const express = require('express');
const router = express.Router();
const {
  getEquitySummary,
  updatePartnerScaleFactor,
  processPayout,
  getPayoutLogs,
} = require('../controllers/equityController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', authorize('super_admin', 'partner'), getEquitySummary);
router.put('/partner-scale', authorize('super_admin'), updatePartnerScaleFactor);
router.post('/payout', authorize('super_admin'), processPayout);
router.get('/payouts', authorize('super_admin', 'partner'), getPayoutLogs);

module.exports = router;
