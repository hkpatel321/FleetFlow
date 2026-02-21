const router = require('express').Router();
const fuelController = require('../controllers/fuel.controller');
const validate = require('../middleware/validate');
const { createFuelLog } = require('../validators/maintenance.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../enums');

router.use(authenticate);

router.get('/', fuelController.getAll);
router.get('/cost-per-km', fuelController.getCostPerKm);
router.get('/:id', fuelController.getById);

router.post(
  '/',
  authorize(UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST),
  validate(createFuelLog),
  fuelController.create
);
router.delete(
  '/:id',
  authorize(UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST),
  fuelController.remove
);

module.exports = router;
