const router = require('express').Router();
const tripController = require('../controllers/trip.controller');
const validate = require('../middleware/validate');
const tripValidator = require('../validators/trip.validator');
const { authenticate, authorize } = require('../middleware/auth');
const { UserRole } = require('../enums');

router.use(authenticate);

router.get('/', tripController.getAll);
router.get('/:id', tripController.getById);

// Create, dispatch, complete, cancel — fleet_manager & dispatcher
const tripRoles = [UserRole.FLEET_MANAGER, UserRole.DISPATCHER];

router.post(
  '/',
  authorize(...tripRoles),
  validate(tripValidator.createTrip),
  tripController.create
);
router.patch(
  '/:id/dispatch',
  authorize(...tripRoles),
  tripController.dispatch
);
router.patch(
  '/:id/complete',
  authorize(...tripRoles),
  validate(tripValidator.completeTrip),
  tripController.complete
);
router.patch(
  '/:id/cancel',
  authorize(...tripRoles),
  tripController.cancel
);

module.exports = router;
