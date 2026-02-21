const catchAsync = require('../utils/catchAsync');
const driverService = require('../services/driver.service');

const getAll = catchAsync(async (req, res) => {
  const drivers = await driverService.getAll(req.query);
  res.status(200).json({ status: 'success', results: drivers.length, data: { drivers } });
});

const getById = catchAsync(async (req, res) => {
  const driver = await driverService.getById(req.params.id);
  res.status(200).json({ status: 'success', data: { driver } });
});

const create = catchAsync(async (req, res) => {
  const driver = await driverService.create(req.body);
  res.status(201).json({ status: 'success', data: { driver } });
});

const update = catchAsync(async (req, res) => {
  const driver = await driverService.update(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: { driver } });
});

const changeStatus = catchAsync(async (req, res) => {
  const driver = await driverService.changeStatus(req.params.id, req.body.status);
  res.status(200).json({ status: 'success', data: { driver } });
});

const autoSuspendExpired = catchAsync(async (req, res) => {
  const result = await driverService.autoSuspendExpired();
  res.status(200).json({ status: 'success', data: result });
});

module.exports = { getAll, getById, create, update, changeStatus, autoSuspendExpired };

