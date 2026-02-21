const router = require('express').Router();
const maintenanceController = require('../controllers/maintenance.controller');
const validate = require('../middleware/validate');
const { createMaintenanceLog } = require('../validators/maintenance.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../enums');

router.use(authenticate);

// View — everyone
router.get('/', maintenanceController.getAll);
router.get('/:id', maintenanceController.getById);

// Create — fleet_manager only
router.post(
  '/',
  authorize(UserRole.FLEET_MANAGER),
  validate(createMaintenanceLog),
  maintenanceController.create
);

// Complete service — fleet_manager only
router.patch(
  '/:id/complete',
  authorize(UserRole.FLEET_MANAGER),
  maintenanceController.completeService
);

// Delete — fleet_manager only
router.delete(
  '/:id',
  authorize(UserRole.FLEET_MANAGER),
  maintenanceController.remove
);

module.exports = router;
