import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api';
import api from '../api';

export default function ReportsPage() {
  const [financial, setFinancial] = useState(null);
  const [fuelEfficiency, setFuelEfficiency] = useState(null);
  const [vehicleROI, setVehicleROI] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [fleetData, setFleetData] = useState(null);
  const [driverData, setDriverData] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [fi, fe, roi, util, fh, dr, tr] = await Promise.all([
          api.get('/reports/financial-summary'),
          analyticsAPI.getFuelEfficiency(),
          analyticsAPI.getVehicleROI(),
          analyticsAPI.getUtilizationRate(),
          api.get('/reports/fleet-health'),
          api.get('/reports/driver-payroll'),
          api.get('/reports/trip-revenue'),
        ]);
        setFinancial(fi.data.data);
        setFuelEfficiency(fe.data.data);
        setVehicleROI(roi.data.data);
        setUtilization(util.data.data);
        setFleetData(fh.data.data);
        setDriverData(dr.data.data);
        setTripData(tr.data.data);
      } catch (err) { console.error('Report fetch error:', err); }
      finally { setLoading(false); }
    }
    fetchAll();
  }, []);

  // CSV Download
  const downloadCSV = async (endpoint, filename) => {
    try {
      const token = localStorage.getItem('fleetflow_token');
      const res = await fetch(`http://localhost:5000/api/v1/reports/${endpoint}?format=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
  };

  if (loading) return <div className="page-loading">Loading reports...</div>;

  // Derived data
  const fleetROI = vehicleROI?.fleet_net_profit && vehicleROI?.fleet_total_revenue
    ? ((vehicleROI.fleet_net_profit / (vehicleROI.fleet_total_revenue || 1)) * 100).toFixed(1)
    : '0.0';

  const avgUtilization = utilization?.fleet_avg_utilization || 0;

  // Top 5 costliest vehicles for bar chart
  const top5Costly = [...(vehicleROI?.vehicles || [])]
    .sort((a, b) => b.total_costs - a.total_costs)
    .slice(0, 5);
  const maxCost = Math.max(...top5Costly.map(v => v.total_costs), 1);

  // Fuel efficiency data for trend chart
  const fuelVehicles = fuelEfficiency?.vehicles || [];

  // Financial summary - build "monthly" view from available data
  const fSummary = financial || {};

  return (
    <div className="page reports-page">
      {/* ─── HEADER ─── */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Operational Analytics & Financial Reports</h1>
          <p className="page-subtitle">Data-driven decision making — FleetFlow</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => downloadCSV('fleet-health', 'fleet_health_report.csv')}>
            📥 Fleet Health CSV
          </button>
          <button className="btn btn-outline" onClick={() => downloadCSV('driver-payroll', 'driver_payroll_report.csv')}>
            📥 Driver Payroll CSV
          </button>
          <button className="btn btn-outline" onClick={() => downloadCSV('trip-revenue', 'trip_revenue_report.csv')}>
            📥 Trip Revenue CSV
          </button>
          <button className="btn btn-outline" onClick={() => window.print()}>
            🖨️ PDF / Print
          </button>
        </div>
      </div>

      {/* ─── TOP KPI CARDS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Total Fuel Cost */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(14,165,233,0.02))',
          border: '1.5px solid rgba(14,165,233,0.3)',
          borderRadius: 12, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(14,165,233,0.9)', fontWeight: 600, marginBottom: 8 }}>Total Fuel Cost</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
            ₹{Number(fSummary.total_fuel_cost || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            All-time fuel expenditure
          </div>
        </div>

        {/* Fleet ROI */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
          border: '1.5px solid rgba(34,197,94,0.3)',
          borderRadius: 12, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(34,197,94,0.9)', fontWeight: 600, marginBottom: 8 }}>Fleet ROI</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: Number(fleetROI) >= 0 ? '#22c55e' : '#ef4444' }}>
            {Number(fleetROI) >= 0 ? '+' : ''}{fleetROI}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            (Revenue − Costs) / Revenue
          </div>
        </div>

        {/* Utilization Rate */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))',
          border: '1.5px solid rgba(168,85,247,0.3)',
          borderRadius: 12, padding: '20px 24px',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(168,85,247,0.9)', fontWeight: 600, marginBottom: 8 }}>Utilization Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#a855f7' }}>
            {avgUtilization}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Fleet-wide average active time
          </div>
        </div>
      </div>

      {/* ─── CHARTS ROW ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Fuel Efficiency Chart (bar chart per vehicle) */}
        <div className="card" style={{ padding: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Fuel Efficiency (km/L)</h3>
          {fuelVehicles.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fuelVehicles.slice(0, 8).map((v, i) => {
                const eff = Number(v.fuel_efficiency_km_per_liter || 0);
                const maxEff = Math.max(...fuelVehicles.map(x => Number(x.fuel_efficiency_km_per_liter || 0)), 1);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 80, fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>
                      {v.vehicle_name?.length > 10 ? v.vehicle_name.slice(0, 10) + '…' : v.vehicle_name}
                    </div>
                    <div style={{ flex: 1, height: 22, background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        width: `${(eff / maxEff) * 100}%`,
                        height: '100%',
                        borderRadius: 6,
                        background: eff >= 8 ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                          : eff >= 4 ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                          : 'linear-gradient(90deg, #ef4444, #dc2626)',
                        transition: 'width 0.8s ease',
                      }} />
                      <span style={{
                        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                        fontSize: 11, fontWeight: 600, color: '#fff',
                      }}>{eff} km/L</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--accent-primary)', marginTop: 8, fontWeight: 600 }}>
                Fleet Avg: {fuelEfficiency?.fleet_average_km_per_liter || '—'} km/L
              </div>
            </div>
          ) : (
            <div className="empty-state">No fuel data</div>
          )}
        </div>

        {/* Top 5 Costliest Vehicles (vertical bar chart) */}
        <div className="card" style={{ padding: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Top 5 Costliest Vehicles</h3>
          {top5Costly.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 200, gap: 8, paddingBottom: 30, position: 'relative' }}>
              {/* Y-axis line */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 30, width: 1, background: 'rgba(255,255,255,0.1)' }} />
              {top5Costly.map((v, i) => {
                const pct = (v.total_costs / maxCost) * 100;
                const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: colors[i] }}>
                      ₹{(v.total_costs / 1000).toFixed(0)}K
                    </div>
                    <div style={{
                      width: '60%', maxWidth: 50,
                      height: `${Math.max(pct, 8)}%`,
                      background: `linear-gradient(180deg, ${colors[i]}, ${colors[i]}88)`,
                      borderRadius: '6px 6px 2px 2px',
                      transition: 'height 0.8s ease',
                      minHeight: 12,
                    }} />
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2, lineHeight: 1.2, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.vehicle_name}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">No cost data</div>
          )}
        </div>
      </div>

      {/* ─── FINANCIAL SUMMARY TABLE ─── */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="card-title" style={{ margin: 0 }}>Financial Summary</h3>
          <button className="btn btn-sm btn-primary" onClick={() => downloadCSV('fleet-health', 'financial_report.csv')}>📥 Export</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ color: '#3b82f6' }}>Period</th>
                <th style={{ color: '#22c55e' }}>Revenue</th>
                <th style={{ color: '#ef4444' }}>Fuel Cost</th>
                <th style={{ color: '#f59e0b' }}>Maintenance</th>
                <th style={{ color: '#a855f7' }}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>All Time</strong></td>
                <td style={{ color: '#22c55e', fontWeight: 600 }}>₹{Number(fSummary.total_revenue || 0).toLocaleString()}</td>
                <td style={{ color: '#ef4444', fontWeight: 600 }}>₹{Number(fSummary.total_fuel_cost || 0).toLocaleString()}</td>
                <td style={{ color: '#f59e0b', fontWeight: 600 }}>₹{Number(fSummary.total_maintenance_cost || 0).toLocaleString()}</td>
                <td style={{ color: fSummary.net_profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 15 }}>
                  ₹{Number(fSummary.net_profit || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 24, fontSize: 12 }}>
          <span>Operating Costs: <strong style={{ color: '#ef4444' }}>₹{Number(fSummary.total_operating_costs || 0).toLocaleString()}</strong></span>
          <span>Profit Margin: <strong style={{ color: fSummary.net_profit >= 0 ? '#22c55e' : '#ef4444' }}>{fSummary.profit_margin || '0.0'}%</strong></span>
        </div>
      </div>

      {/* ─── VEHICLE ROI TABLE ─── */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 4 }}>Vehicle ROI — (Revenue − Maintenance − Fuel) / Acquisition Cost</h3>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Net profit as a percentage of each vehicle's acquisition cost</p>
        <div className="table-container">
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Acquisition ₹</th>
                <th style={{ color: '#22c55e' }}>Revenue ₹</th>
                <th style={{ color: '#ef4444' }}>Fuel ₹</th>
                <th style={{ color: '#f59e0b' }}>Maint. ₹</th>
                <th>Net Profit ₹</th>
                <th>ROI %</th>
              </tr>
            </thead>
            <tbody>
              {vehicleROI?.vehicles?.map(v => (
                <tr key={v.vehicle_id}>
                  <td><strong>{v.vehicle_name}</strong><br/><small className="text-muted">{v.license_plate}</small></td>
                  <td>{v.acquisition_cost > 0 ? `₹${Number(v.acquisition_cost).toLocaleString()}` : '—'}</td>
                  <td style={{ color: '#22c55e' }}>₹{Number(v.total_revenue).toLocaleString()}</td>
                  <td style={{ color: '#ef4444' }}>₹{Number(v.total_fuel_cost).toLocaleString()}</td>
                  <td style={{ color: '#f59e0b' }}>₹{Number(v.total_maintenance_cost).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: v.profitable ? '#22c55e' : '#ef4444' }}>
                    ₹{Number(v.net_profit).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(0, Number(v.roi_percentage) || 0))}%`,
                          height: '100%', borderRadius: 3,
                          background: Number(v.roi_percentage) >= 0 ? '#22c55e' : '#ef4444',
                        }} />
                      </div>
                      <strong style={{ color: Number(v.roi_percentage) >= 0 ? '#22c55e' : '#ef4444' }}>
                        {v.roi_percentage !== null ? `${v.roi_percentage}%` : '—'}
                      </strong>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── FLEET HEALTH TABLE ─── */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Fleet Health Audit</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>{fleetData?.report?.length || 0} vehicles</p>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => downloadCSV('fleet-health', 'fleet_health_report.csv')}>📥 CSV</button>
        </div>
        <div className="table-container">
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Trips</th>
                <th>Distance</th>
                <th>Revenue</th>
                <th>km/L</th>
                <th>Maint. ₹</th>
                <th>ROI</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {fleetData?.report?.map((v, i) => (
                <tr key={i}>
                  <td><strong>{v.name}</strong><br/><small className="text-muted">{v.license_plate}</small></td>
                  <td><span className={`status-badge status-${v.status.toLowerCase().replace(/[_ ]/g, '-')}`}>{v.status.replace('_',' ')}</span></td>
                  <td>{v.total_trips}</td>
                  <td>{Number(v.total_distance_km).toLocaleString()} km</td>
                  <td style={{ color: '#22c55e' }}>₹{Number(v.total_revenue).toLocaleString()}</td>
                  <td><strong>{v.fuel_efficiency_km_per_l || '—'}</strong></td>
                  <td style={{ color: '#f59e0b' }}>₹{Number(v.total_maintenance_cost).toLocaleString()}</td>
                  <td>{v.roi_percentage ? `${v.roi_percentage}%` : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 40, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${v.utilization_rate}%`, height: '100%', borderRadius: 3,
                          background: Number(v.utilization_rate) >= 50 ? '#22c55e' : Number(v.utilization_rate) >= 20 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                      <span>{v.utilization_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── DRIVER PAYROLL TABLE ─── */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Driver Payroll Report</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>{driverData?.report?.length || 0} drivers</p>
          </div>
          <button className="btn btn-sm btn-outline" onClick={() => downloadCSV('driver-payroll', 'driver_payroll_report.csv')}>📥 CSV</button>
        </div>
        <div className="table-container">
          <table className="data-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Driver</th>
                <th>License</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Safety</th>
                <th>Trips</th>
                <th>Revenue Generated</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {driverData?.report?.map((d, i) => (
                <tr key={i} style={d.license_expired === 'YES' ? { background: 'rgba(239,68,68,0.05)' } : {}}>
                  <td><strong>{d.full_name}</strong><br/><small className="text-muted">{d.phone || '—'}</small></td>
                  <td>{d.license_number}<br/><small className="text-muted">{d.license_category}</small></td>
                  <td style={{ color: d.license_expired === 'YES' ? '#ef4444' : 'inherit' }}>
                    {d.license_expiry} {d.license_expired === 'YES' && '⚠️'}
                  </td>
                  <td><span className={`status-badge status-${d.status.toLowerCase().replace(/[_ ]/g, '-')}`}>{d.status.replace('_',' ')}</span></td>
                  <td><strong>{d.safety_score}</strong></td>
                  <td>{d.completed_trips}/{d.total_trips} ({d.completion_rate}%)</td>
                  <td style={{ color: '#22c55e', fontWeight: 600 }}>₹{Number(d.total_revenue_generated).toLocaleString()}</td>
                  <td>{Number(d.total_distance_km).toLocaleString()} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
