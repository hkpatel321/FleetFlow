const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ─── Basic Analytics ─────────────────────────────────────
router.get('/fleet-summary', analyticsController.getFleetSummary);
router.get('/trip-stats', analyticsController.getTripStats);
router.get('/fuel-costs', analyticsController.getFuelCosts);
router.get('/maintenance-costs', analyticsController.getMaintenanceCosts);
router.get('/driver-performance', analyticsController.getDriverPerformance);

// ─── Advanced Analytics ──────────────────────────────────
router.get('/fuel-efficiency', analyticsController.getFuelEfficiency);
router.get('/vehicle-roi', analyticsController.getVehicleROI);
router.get('/utilization-rate', analyticsController.getUtilizationRate);
router.get('/dead-stock', analyticsController.getDeadStock); // ?days=30

module.exports = router;
