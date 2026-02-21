const catchAsync = require('../utils/catchAsync');
const vehicleService = require('../services/vehicle.service');

const getAll = catchAsync(async (req, res) => {
  const vehicles = await vehicleService.getAll(req.query);
  res.status(200).json({ status: 'success', results: vehicles.length, data: { vehicles } });
});

const getAvailable = catchAsync(async (req, res) => {
  const vehicles = await vehicleService.getAvailable();
  res.status(200).json({ status: 'success', results: vehicles.length, data: { vehicles } });
});

const getById = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.getById(req.params.id);
  res.status(200).json({ status: 'success', data: { vehicle } });
});

const create = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.create(req.body);
  res.status(201).json({ status: 'success', data: { vehicle } });
});

const update = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.update(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: { vehicle } });
});

const changeStatus = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.changeStatus(req.params.id, req.body.status);
  res.status(200).json({ status: 'success', data: { vehicle } });
});

const remove = catchAsync(async (req, res) => {
  await vehicleService.remove(req.params.id);
  res.status(204).json({ status: 'success', data: null });
});

module.exports = { getAll, getAvailable, getById, create, update, changeStatus, remove };
