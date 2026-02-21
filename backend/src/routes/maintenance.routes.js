const router = require('express').Router();
const maintenanceController = require('../controllers/maintenance.controller');
const validate = require('../middleware/validate');
const { createMaintenance } = require('../validators/maintenance.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../enums');

router.use(authenticate);

router.get('/', maintenanceController.getAll);
router.get('/:id', maintenanceController.getById);

// Create maintenance log — auto sets vehicle to In_Shop
router.post(
  '/',
  authorize(UserRole.FLEET_MANAGER),
  validate(createMaintenance),
  maintenanceController.create
);

// Complete service — restores vehicle to Available
router.patch(
  '/:id/complete',
  authorize(UserRole.FLEET_MANAGER),
  maintenanceController.completeService
);

router.delete('/:id', authorize(UserRole.FLEET_MANAGER), maintenanceController.remove);

module.exports = router;
