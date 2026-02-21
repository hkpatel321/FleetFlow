const catchAsync = require('../utils/catchAsync');
const analyticsService = require('../services/analytics.service');

const getFleetSummary = catchAsync(async (req, res) => {
  const data = await analyticsService.getFleetSummary();
  res.status(200).json({ status: 'success', data });
});

const getTripStats = catchAsync(async (req, res) => {
  const data = await analyticsService.getTripStats();
  res.status(200).json({ status: 'success', data });
});

const getFuelCosts = catchAsync(async (req, res) => {
  const data = await analyticsService.getFuelCosts();
  res.status(200).json({ status: 'success', data });
});

const getMaintenanceCosts = catchAsync(async (req, res) => {
  const data = await analyticsService.getMaintenanceCosts();
  res.status(200).json({ status: 'success', data });
});

const getDriverPerformance = catchAsync(async (req, res) => {
  const data = await analyticsService.getDriverPerformance();
  res.status(200).json({ status: 'success', data });
});

// ─── NEW ADVANCED ANALYTICS ──────────────────────────────

const getFuelEfficiency = catchAsync(async (req, res) => {
  const data = await analyticsService.getFuelEfficiency();
  res.status(200).json({ status: 'success', data });
});

const getVehicleROI = catchAsync(async (req, res) => {
  const data = await analyticsService.getVehicleROI();
  res.status(200).json({ status: 'success', data });
});

const getUtilizationRate = catchAsync(async (req, res) => {
  const data = await analyticsService.getUtilizationRate();
  res.status(200).json({ status: 'success', data });
});

const getDeadStock = catchAsync(async (req, res) => {
  const threshold = Number(req.query.days) || 30;
  const data = await analyticsService.getDeadStock(threshold);
  res.status(200).json({ status: 'success', data });
});

module.exports = {
  getFleetSummary,
  getTripStats,
  getFuelCosts,
  getMaintenanceCosts,
  getDriverPerformance,
  getFuelEfficiency,
  getVehicleROI,
  getUtilizationRate,
  getDeadStock,
};
