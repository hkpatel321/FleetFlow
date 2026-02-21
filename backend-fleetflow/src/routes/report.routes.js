const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// JSON or CSV (add ?format=csv to download as CSV)
router.get('/fleet-health', reportController.getFleetHealth);
router.get('/driver-payroll', reportController.getDriverReport);
router.get('/trip-revenue', reportController.getTripReport);
router.get('/financial-summary', reportController.getFinancialSummary);

module.exports = router;
