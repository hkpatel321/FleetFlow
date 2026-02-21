import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api';

export default function DashboardPage() {
  const [fleet, setFleet] = useState(null);
  const [trips, setTrips] = useState(null);
  const [fuel, setFuel] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [drivers, setDrivers] = useState(null);
  const [fuelEfficiency, setFuelEfficiency] = useState(null);
  const [vehicleROI, setVehicleROI] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [deadStock, setDeadStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchAll() {
      try {
        const [f, t, fu, m, d, fe, roi, util, ds] = await Promise.all([
          analyticsAPI.getFleetSummary(),
          analyticsAPI.getTripStats(),
          analyticsAPI.getFuelCosts(),
          analyticsAPI.getMaintenanceCosts(),
          analyticsAPI.getDriverPerformance(),
          analyticsAPI.getFuelEfficiency(),
          analyticsAPI.getVehicleROI(),
          analyticsAPI.getUtilizationRate(),
          analyticsAPI.getDeadStock(30),
        ]);
        setFleet(f.data.data);
        setTrips(t.data.data);
        setFuel(fu.data.data);
        setMaintenance(m.data.data);
        setDrivers(d.data.data);
        setFuelEfficiency(fe.data.data);
        setVehicleROI(roi.data.data);
        setUtilization(util.data.data);
        setDeadStock(ds.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <p className="page-subtitle">Fleet overview, efficiency, ROI, and utilization metrics</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-switch" style={{ marginBottom: 20 }}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'efficiency', label: '⛽ Fuel Efficiency' },
          { key: 'roi', label: '💰 Vehicle ROI' },
          { key: 'utilization', label: '📈 Utilization' },
          { key: 'deadstock', label: '⚠️ Dead Stock' },
        ].map(tb => (
          <button key={tb.key} className={`tab-btn ${activeTab === tb.key ? 'active' : ''}`} onClick={() => setActiveTab(tb.key)}>
            {tb.label}
            {tb.key === 'deadstock' && deadStock?.dead_stock_count > 0 && (
              <span style={{ background: 'var(--accent-danger)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>
                {deadStock.dead_stock_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">🚛</div>
              <div className="stat-info">
                <span className="stat-value">{fleet?.total_vehicles || 0}</span>
                <span className="stat-label">Total Vehicles</span>
              </div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-icon">🗺️</div>
              <div className="stat-info">
                <span className="stat-value">{trips?.total_trips || 0}</span>
                <span className="stat-label">Total Trips</span>
              </div>
            </div>
            <div className="stat-card stat-warning">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <span className="stat-value">₹{Number(trips?.completed?.total_revenue || 0).toLocaleString()}</span>
                <span className="stat-label">Total Revenue</span>
              </div>
            </div>
            <div className="stat-card stat-danger">
              <div className="stat-icon">⛽</div>
              <div className="stat-info">
                <span className="stat-value">₹{Number(fuel?.total_fuel_cost || 0).toLocaleString()}</span>
                <span className="stat-label">Fuel Costs</span>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <h3 className="card-title">Fleet Status</h3>
              <div className="status-bars">
                {fleet?.by_status && Object.entries(fleet.by_status).map(([status, count]) => (
                  <div key={status} className="status-bar-item">
                    <div className="status-bar-label">
                      <span className={`status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status.replace('_', ' ')}</span>
                      <span className="status-bar-count">{count}</span>
                    </div>
                    <div className="status-bar-track">
                      <div className={`status-bar-fill status-fill-${status.toLowerCase().replace(/\s+/g, '-')}`} style={{ width: `${(count / fleet.total_vehicles) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Trip Status</h3>
              <div className="status-bars">
                {trips?.by_status && Object.entries(trips.by_status).map(([status, count]) => (
                  <div key={status} className="status-bar-item">
                    <div className="status-bar-label">
                      <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
                      <span className="status-bar-count">{count}</span>
                    </div>
                    <div className="status-bar-track">
                      <div className={`status-bar-fill status-fill-${status.toLowerCase()}`} style={{ width: `${trips.total_trips > 0 ? (count / trips.total_trips) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Maintenance Costs</h3>
              <div className="cost-summary">
                <div className="cost-total">
                  <span className="cost-amount">₹{Number(maintenance?.total_maintenance_cost || 0).toLocaleString()}</span>
                  <span className="cost-label">Total Maintenance</span>
                </div>
                <div className="cost-count">{maintenance?.total_entries || 0} entries</div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Top Drivers</h3>
              <div className="driver-list">
                {drivers?.slice(0, 5).map((d) => (
                  <div key={d.id} className="driver-list-item">
                    <div className="driver-list-name">{d.full_name}</div>
                    <div className="driver-list-score">
                      <span className={`safety-score ${Number(d.safety_score) >= 90 ? 'score-good' : Number(d.safety_score) >= 70 ? 'score-mid' : 'score-low'}`}>
                        {Number(d.safety_score).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── FUEL EFFICIENCY TAB ─── */}
      {activeTab === 'efficiency' && (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">⛽</div>
              <div className="stat-info">
                <span className="stat-value">{fuelEfficiency?.fleet_average_km_per_liter || '—'}</span>
                <span className="stat-label">Fleet Avg km/L</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">Fuel Efficiency by Vehicle (distance_km / liters)</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Distance (km)</th>
                    <th>Fuel (L)</th>
                    <th>Fuel Cost</th>
                    <th>km/L</th>
                    <th>₹/km</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelEfficiency?.vehicles?.map(v => (
                    <tr key={v.vehicle_id}>
                      <td><strong>{v.vehicle_name}</strong><br/><small className="text-muted">{v.license_plate}</small></td>
                      <td>{v.vehicle_type}</td>
                      <td>{Number(v.total_distance_km).toLocaleString()}</td>
                      <td>{Number(v.total_liters).toFixed(1)}</td>
                      <td>₹{Number(v.total_fuel_cost).toLocaleString()}</td>
                      <td>
                        <strong style={{ color: Number(v.fuel_efficiency_km_per_liter) >= 5 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                          {v.fuel_efficiency_km_per_liter || '—'}
                        </strong>
                      </td>
                      <td>{v.cost_per_km ? `₹${v.cost_per_km}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!fuelEfficiency?.vehicles || fuelEfficiency.vehicles.length === 0) && (
                <div className="empty-state">No fuel data available yet</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── VEHICLE ROI TAB ─── */}
      {activeTab === 'roi' && (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-success">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <span className="stat-value">₹{Number(vehicleROI?.fleet_total_revenue || 0).toLocaleString()}</span>
                <span className="stat-label">Fleet Revenue</span>
              </div>
            </div>
            <div className="stat-card stat-danger">
              <div className="stat-icon">📉</div>
              <div className="stat-info">
                <span className="stat-value">₹{Number(vehicleROI?.fleet_total_costs || 0).toLocaleString()}</span>
                <span className="stat-label">Fleet Costs</span>
              </div>
            </div>
            <div className="stat-card stat-primary">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <span className="stat-value" style={{ color: (vehicleROI?.fleet_net_profit || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  ₹{Number(vehicleROI?.fleet_net_profit || 0).toLocaleString()}
                </span>
                <span className="stat-label">Net Profit</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">Vehicle ROI = (Revenue - Fuel - Maintenance) / Acquisition Cost × 100</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Acquisition Cost</th>
                    <th>Revenue</th>
                    <th>Fuel Cost</th>
                    <th>Maint. Cost</th>
                    <th>Net Profit</th>
                    <th>ROI %</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleROI?.vehicles?.map(v => (
                    <tr key={v.vehicle_id}>
                      <td><strong>{v.vehicle_name}</strong><br/><small className="text-muted">{v.license_plate}</small></td>
                      <td>{v.acquisition_cost > 0 ? `₹${Number(v.acquisition_cost).toLocaleString()}` : '—'}</td>
                      <td style={{ color: 'var(--accent-success)' }}>₹{Number(v.total_revenue).toLocaleString()}</td>
                      <td style={{ color: 'var(--accent-danger)' }}>₹{Number(v.total_fuel_cost).toLocaleString()}</td>
                      <td style={{ color: 'var(--accent-danger)' }}>₹{Number(v.total_maintenance_cost).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: v.profitable ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                        ₹{Number(v.net_profit).toLocaleString()}
                      </td>
                      <td>
                        <strong style={{ color: Number(v.roi_percentage) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                          {v.roi_percentage !== null ? `${v.roi_percentage}%` : '—'}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── UTILIZATION RATE TAB ─── */}
      {activeTab === 'utilization' && (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <span className="stat-value">{utilization?.fleet_avg_utilization || 0}%</span>
                <span className="stat-label">Fleet Avg Utilization</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">Utilization Rate = (Active Trip Days / Total Days) × 100</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Total Days</th>
                    <th>Active Days</th>
                    <th>Idle Days</th>
                    <th>Trips</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {utilization?.vehicles?.map(v => (
                    <tr key={v.vehicle_id}>
                      <td><strong>{v.vehicle_name}</strong><br/><small className="text-muted">{v.license_plate}</small></td>
                      <td><span className={`status-badge status-${v.current_status.toLowerCase().replace(/[_ ]/g, '-')}`}>{v.current_status.replace('_', ' ')}</span></td>
                      <td>{v.total_days}</td>
                      <td>{v.active_days}</td>
                      <td>{v.idle_days}</td>
                      <td>{v.trip_count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              width: `${v.utilization_rate}%`,
                              height: '100%',
                              borderRadius: 4,
                              background: v.utilization_rate >= 50 ? 'var(--accent-success)' : v.utilization_rate >= 20 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                            }} />
                          </div>
                          <strong>{v.utilization_rate}%</strong>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── DEAD STOCK TAB ─── */}
      {activeTab === 'deadstock' && (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-danger">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <span className="stat-value">{deadStock?.dead_stock_count || 0}</span>
                <span className="stat-label">Dead Stock Vehicles</span>
              </div>
            </div>
            <div className="stat-card stat-warning">
              <div className="stat-icon">💸</div>
              <div className="stat-info">
                <span className="stat-value">₹{Number(deadStock?.total_capital_tied_up || 0).toLocaleString()}</span>
                <span className="stat-label">Capital Tied Up</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">Vehicles Idle for {deadStock?.threshold_days || 30}+ Days (No Trip Dispatched)</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Last Trip</th>
                    <th>Idle Days</th>
                    <th>Acquisition Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {deadStock?.vehicles?.map(v => (
                    <tr key={v.vehicle_id} style={{ background: v.idle_days > 60 ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.04)' }}>
                      <td><strong>{v.vehicle_name}</strong><br/><small className="text-muted">{v.license_plate}</small></td>
                      <td>{v.vehicle_type}</td>
                      <td><span className={`status-badge status-${v.current_status.toLowerCase().replace(/[_ ]/g, '-')}`}>{v.current_status.replace('_', ' ')}</span></td>
                      <td>{v.last_trip_date || <span className="text-danger">Never used</span>}</td>
                      <td><strong style={{ color: v.idle_days > 60 ? 'var(--accent-danger)' : 'var(--accent-warning)' }}>{v.idle_days} days</strong></td>
                      <td>{v.acquisition_cost > 0 ? `₹${Number(v.acquisition_cost).toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!deadStock?.vehicles || deadStock.vehicles.length === 0) && (
                <div className="empty-state" style={{ color: 'var(--accent-success)' }}>
                  ✅ No dead stock! All vehicles have been active within the last {deadStock?.threshold_days || 30} days.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
