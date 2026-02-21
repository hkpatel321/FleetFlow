const catchAsync = require('../utils/catchAsync');
const fuelService = require('../services/fuel.service');

const getAll = catchAsync(async (req, res) => {
  const logs = await fuelService.getAll(req.query);
  res.status(200).json({ status: 'success', results: logs.length, data: { fuel_logs: logs } });
});

const getById = catchAsync(async (req, res) => {
  const log = await fuelService.getById(req.params.id);
  res.status(200).json({ status: 'success', data: { fuel_log: log } });
});

const create = catchAsync(async (req, res) => {
  const log = await fuelService.create(req.body);
  res.status(201).json({ status: 'success', data: { fuel_log: log } });
});

const getCostPerKm = catchAsync(async (req, res) => {
  const data = await fuelService.getCostPerKm();
  res.status(200).json({ status: 'success', data: { cost_per_km: data } });
});

const remove = catchAsync(async (req, res) => {
  await fuelService.remove(req.params.id);
  res.status(204).json({ status: 'success', data: null });
});

module.exports = { getAll, getById, create, getCostPerKm, remove };
