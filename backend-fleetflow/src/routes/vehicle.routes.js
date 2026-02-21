const router = require('express').Router();
const vehicleController = require('../controllers/vehicle.controller');
const validate = require('../middleware/validate');
const vehicleValidator = require('../validators/vehicle.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../enums');

// All routes require authentication
router.use(authenticate);

router.get('/', vehicleController.getAll);
router.get('/available', vehicleController.getAvailable);
router.get('/:id', vehicleController.getById);

// Create/Update/Delete — fleet_manager only
router.post(
  '/',
  authorize(UserRole.FLEET_MANAGER),
  validate(vehicleValidator.createVehicle),
  vehicleController.create
);
router.put(
  '/:id',
  authorize(UserRole.FLEET_MANAGER),
  validate(vehicleValidator.updateVehicle),
  vehicleController.update
);
router.patch(
  '/:id/status',
  authorize(UserRole.FLEET_MANAGER),
  validate(vehicleValidator.changeStatus),
  vehicleController.changeStatus
);
router.delete('/:id', authorize(UserRole.FLEET_MANAGER), vehicleController.remove);

module.exports = router;
