const catchAsync = require('../utils/catchAsync');
const reportService = require('../services/report.service');

const getFleetHealth = catchAsync(async (req, res) => {
  const data = await reportService.getFleetHealthReport();
  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fleet_health_report.csv');
    return res.send(data.csv);
  }
  res.status(200).json({ status: 'success', data: { report: data.rows, columns: data.columns } });
});

const getDriverReport = catchAsync(async (req, res) => {
  const data = await reportService.getDriverReport();
  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=driver_payroll_report.csv');
    return res.send(data.csv);
  }
  res.status(200).json({ status: 'success', data: { report: data.rows, columns: data.columns } });
});

const getTripReport = catchAsync(async (req, res) => {
  const data = await reportService.getTripReport();
  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trip_revenue_report.csv');
    return res.send(data.csv);
  }
  res.status(200).json({ status: 'success', data: { report: data.rows, columns: data.columns } });
});

const getFinancialSummary = catchAsync(async (req, res) => {
  const data = await reportService.getFinancialSummary();
  res.status(200).json({ status: 'success', data });
});

module.exports = { getFleetHealth, getDriverReport, getTripReport, getFinancialSummary };
