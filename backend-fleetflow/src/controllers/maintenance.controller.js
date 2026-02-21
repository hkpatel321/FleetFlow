const catchAsync = require('../utils/catchAsync');
const maintenanceService = require('../services/maintenance.service');

const getAll = catchAsync(async (req, res) => {
  const logs = await maintenanceService.getAll(req.query);
  res.status(200).json({ status: 'success', results: logs.length, data: { maintenance_logs: logs } });
});

const getById = catchAsync(async (req, res) => {
  const log = await maintenanceService.getById(req.params.id);
  res.status(200).json({ status: 'success', data: { maintenance_log: log } });
});

const create = catchAsync(async (req, res) => {
  const log = await maintenanceService.create(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { maintenance_log: log } });
});

const completeService = catchAsync(async (req, res) => {
  const result = await maintenanceService.completeService(req.params.id);
  res.status(200).json({ status: 'success', data: result });
});

const remove = catchAsync(async (req, res) => {
  await maintenanceService.remove(req.params.id);
  res.status(204).json({ status: 'success', data: null });
});

module.exports = { getAll, getById, create, completeService, remove };
