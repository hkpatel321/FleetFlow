const catchAsync = require('../utils/catchAsync');
const tripService = require('../services/trip.service');

const getAll = catchAsync(async (req, res) => {
  const trips = await tripService.getAll(req.query);
  res.status(200).json({ status: 'success', results: trips.length, data: { trips } });
});

const getById = catchAsync(async (req, res) => {
  const trip = await tripService.getById(req.params.id);
  res.status(200).json({ status: 'success', data: { trip } });
});

const create = catchAsync(async (req, res) => {
  const trip = await tripService.create(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { trip } });
});

const dispatch = catchAsync(async (req, res) => {
  const trip = await tripService.dispatch(req.params.id);
  res.status(200).json({ status: 'success', data: { trip } });
});

const complete = catchAsync(async (req, res) => {
  const trip = await tripService.complete(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: { trip } });
});

const cancel = catchAsync(async (req, res) => {
  const trip = await tripService.cancel(req.params.id);
  res.status(200).json({ status: 'success', data: { trip } });
});

module.exports = { getAll, getById, create, dispatch, complete, cancel };
