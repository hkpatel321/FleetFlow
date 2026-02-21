const router = require('express').Router();
const driverController = require('../controllers/driver.controller');
const validate = require('../middleware/validate');
const driverValidator = require('../validators/driver.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../enums');

router.use(authenticate);

router.get('/', driverController.getAll);
router.get('/:id', driverController.getById);

router.post(
  '/',
  authorize(UserRole.FLEET_MANAGER),
  validate(driverValidator.createDriver),
  driverController.create
);
router.put(
  '/:id',
  authorize(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER),
  validate(driverValidator.updateDriver),
  driverController.update
);
router.patch(
  '/:id/status',
  authorize(UserRole.FLEET_MANAGER),
  validate(driverValidator.changeStatus),
  driverController.changeStatus
);

// Auto-suspend all drivers with expired licenses
router.post(
  '/auto-suspend',
  authorize(UserRole.FLEET_MANAGER),
  driverController.autoSuspendExpired
);

module.exports = router;
