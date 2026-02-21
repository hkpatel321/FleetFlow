const router = require('express').Router();
const driverController = require('../controllers/driver.controller');
const validate = require('../middleware/validate');
const driverValidator = require('../validators/driver.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../enums');

router.use(authenticate);

// View — everyone
router.get('/', driverController.getAll);
router.get('/:id', driverController.getById);

// Create — fleet_manager + safety_officer
router.post(
  '/',
  authorize(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER),
  validate(driverValidator.createDriver),
  driverController.create
);

// Update — fleet_manager + safety_officer
router.put(
  '/:id',
  authorize(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER),
  validate(driverValidator.updateDriver),
  driverController.update
);

// Status change — fleet_manager + safety_officer
router.patch(
  '/:id/status',
  authorize(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER),
  validate(driverValidator.changeStatus),
  driverController.changeStatus
);

// Auto-suspend — fleet_manager + safety_officer
router.post(
  '/auto-suspend',
  authorize(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER),
  driverController.autoSuspendExpired
);

module.exports = router;
