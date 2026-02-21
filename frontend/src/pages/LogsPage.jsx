import { useState, useEffect } from 'react';
import { maintenanceAPI, fuelAPI, vehiclesAPI, tripsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LogsPage() {
  const [tab, setTab] = useState('maintenance');
  const [mainLogs, setMainLogs] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [costPerKm, setCostPerKm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mainForm, setMainForm] = useState({ vehicle_id: '', service_type: '', cost: '', service_date: '', notes: '' });
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', trip_id: '', liters: '', cost_per_liter: '', date: '', odometer_reading: '' });
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const { isAuthorized } = useAuth();
  const canEditMaint = isAuthorized('fleet_manager');
  const canEditFuel = isAuthorized('fleet_manager', 'financial_analyst');

  const fetchData = async () => {
    try {
      const [m, f, v, t] = await Promise.all([
        maintenanceAPI.getAll(), fuelAPI.getAll(), vehiclesAPI.getAll(), tripsAPI.getAll(),
      ]);
      setMainLogs(m.data.data.maintenance_logs);
      setFuelLogs(f.data.data.fuel_logs);
      setVehicles(v.data.data.vehicles);
      setTrips(t.data.data.trips);

      // Fetch cost-per-km analytics
      try {
        const cpk = await fuelAPI.getCostPerKm();
        setCostPerKm(cpk.data.data.cost_per_km);
      } catch { /* non-critical */ }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Vehicles that can be serviced (not retired, not on trip)
  const serviceableVehicles = vehicles.filter(v => v.status !== 'Retired' && v.status !== 'On_Trip');

  // Trips that belong to the selected fuel form vehicle
  const vehicleTrips = trips.filter(t => t.vehicle_id === fuelForm.vehicle_id);

  const handleCreateMain = async (e) => {
    e.preventDefault(); setError('');
    try {
      await maintenanceAPI.create({ ...mainForm, cost: Number(mainForm.cost) });
      setShowForm(false);
      setMainForm({ vehicle_id: '', service_type: '', cost: '', service_date: '', notes: '' });
      setNotification('✅ Maintenance log created. Vehicle moved to "In Shop".');
      setTimeout(() => setNotification(null), 4000);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  const handleCompleteService = async (logId) => {
    try {
      const res = await maintenanceAPI.completeService(logId);
      setNotification(`✅ ${res.data.data.message}`);
      setTimeout(() => setNotification(null), 4000);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Complete failed'); }
  };

  const handleCreateFuel = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = {
        vehicle_id: fuelForm.vehicle_id,
        trip_id: fuelForm.trip_id || undefined,
        liters: Number(fuelForm.liters),
        cost_per_liter: Number(fuelForm.cost_per_liter),
        date: fuelForm.date,
        odometer_reading: fuelForm.odometer_reading ? Number(fuelForm.odometer_reading) : undefined,
      };
      await fuelAPI.create(payload);
      setShowForm(false);
      setFuelForm({ vehicle_id: '', trip_id: '', liters: '', cost_per_liter: '', date: '', odometer_reading: '' });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="page-loading">Loading logs...</div>;

  const canEdit = tab === 'maintenance' ? canEditMaint : canEditFuel;
  const inShopCount = vehicles.filter(v => v.status === 'In_Shop').length;

  // Auto-compute total for fuel form preview
  const fuelPreviewTotal = fuelForm.liters && fuelForm.cost_per_liter
    ? (Number(fuelForm.liters) * Number(fuelForm.cost_per_liter)).toFixed(2)
    : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{tab === 'maintenance' ? 'Maintenance Logs' : 'Fuel Logs'}</h1>
          <div className="tab-switch">
            <button className={`tab-btn ${tab === 'maintenance' ? 'active' : ''}`} onClick={() => { setTab('maintenance'); setShowForm(false); }}>
              🔧 Maintenance {inShopCount > 0 && <span style={{ background: 'var(--accent-warning)', color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>{inShopCount}</span>}
            </button>
            <button className={`tab-btn ${tab === 'fuel' ? 'active' : ''}`} onClick={() => { setTab('fuel'); setShowForm(false); }}>⛽ Fuel</button>
          </div>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Log'}
          </button>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className="alert" style={{ background: 'rgba(34,197,94,0.08)', color: 'var(--accent-success)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 16 }}>
          {notification}
        </div>
      )}

      {/* Maintenance Flow Reference */}
      {tab === 'maintenance' && (
        <div className="card" style={{ marginBottom: 16, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Maintenance Flow:</span>
            <span>Create Log</span>
            <span className="route-arrow">→</span>
            <span className="status-badge status-in-shop">Vehicle → In Shop</span>
            <span className="route-arrow">→</span>
            <span>Complete Service</span>
            <span className="route-arrow">→</span>
            <span className="status-badge status-available">Vehicle → Available</span>
          </div>
        </div>
      )}

      {/* Cost Per Km Summary (Fuel tab) */}
      {tab === 'fuel' && costPerKm.length > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <h4 style={{ marginBottom: 12, fontSize: 14 }}>📊 Fuel Cost Per Km by Vehicle</h4>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {costPerKm.map(v => (
              <div key={v.vehicle_id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '10px 14px', minWidth: 180,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{v.vehicle_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.license_plate}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {v.cost_per_km ? `₹${v.cost_per_km}` : '—'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>per km</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{Number(v.total_distance_km).toLocaleString()} km</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>distance</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Create Form */}
      {showForm && tab === 'maintenance' && (
        <div className="card form-card">
          <h3>Add Maintenance Log</h3>
          <p style={{ fontSize: 12, color: 'var(--accent-warning)', marginBottom: 8 }}>
            ⚠️ Creating a log will automatically set the vehicle status to "In Shop"
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="inline-form" onSubmit={handleCreateMain}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vehicle (non-retired)</label>
              <select value={mainForm.vehicle_id} onChange={e => setMainForm({...mainForm, vehicle_id: e.target.value})} required>
                <option value="">Select Vehicle</option>
                {serviceableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate}) — {v.status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <input placeholder="Service Type *" value={mainForm.service_type} onChange={e => setMainForm({...mainForm, service_type: e.target.value})} required />
            <input placeholder="Cost (₹) *" type="number" value={mainForm.cost} onChange={e => setMainForm({...mainForm, cost: e.target.value})} required />
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Service Date</label>
              <input type="date" value={mainForm.service_date} onChange={e => setMainForm({...mainForm, service_date: e.target.value})} required />
            </div>
            <input placeholder="Notes" value={mainForm.notes} onChange={e => setMainForm({...mainForm, notes: e.target.value})} />
            <button type="submit" className="btn btn-primary">Create & Send to Shop</button>
          </form>
        </div>
      )}

      {/* Fuel Create Form */}
      {showForm && tab === 'fuel' && (
        <div className="card form-card">
          <h3>Add Fuel Log</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="inline-form" onSubmit={handleCreateFuel}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vehicle *</label>
              <select value={fuelForm.vehicle_id} onChange={e => setFuelForm({...fuelForm, vehicle_id: e.target.value, trip_id: ''})} required>
                <option value="">Select Vehicle</option>
                {vehicles.filter(v => v.status !== 'Retired').map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.license_plate}) — {v.status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Link to Trip (optional)</label>
              <select value={fuelForm.trip_id} onChange={e => setFuelForm({...fuelForm, trip_id: e.target.value})}>
                <option value="">No trip (general fueling)</option>
                {vehicleTrips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.origin} → {t.destination} ({t.status})
                  </option>
                ))}
              </select>
            </div>
            <input placeholder="Liters *" type="number" step="0.1" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: e.target.value})} required />
            <input placeholder="Cost/Liter (₹) *" type="number" step="0.01" value={fuelForm.cost_per_liter} onChange={e => setFuelForm({...fuelForm, cost_per_liter: e.target.value})} required />
            {fuelPreviewTotal && (
              <div style={{ alignSelf: 'center', fontSize: 13, color: 'var(--accent-primary)', fontWeight: 600 }}>
                = ₹{Number(fuelPreviewTotal).toLocaleString()} total
              </div>
            )}
            <input placeholder="Odometer Reading (km)" type="number" value={fuelForm.odometer_reading} onChange={e => setFuelForm({...fuelForm, odometer_reading: e.target.value})} />
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date *</label>
              <input type="date" value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            total_cost is auto-calculated: liters × cost_per_liter
          </p>
        </div>
      )}

      {/* Maintenance Table */}
      {tab === 'maintenance' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Vehicle Status</th>
                <th>Service Type</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Notes</th>
                {canEditMaint && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {mainLogs.map(l => {
                const isInShop = l.vehicle?.status === 'In_Shop';
                return (
                  <tr key={l.id} style={isInShop ? { background: 'rgba(245, 158, 11, 0.04)' } : {}}>
                    <td>{l.vehicle?.name || '—'}<br/><small className="text-muted">{l.vehicle?.license_plate}</small></td>
                    <td>
                      <span className={`status-badge status-${(l.vehicle?.status || '').toLowerCase().replace(/[_ ]/g, '-')}`}>
                        {(l.vehicle?.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td>{l.service_type}</td>
                    <td>₹{Number(l.cost).toLocaleString()}</td>
                    <td>{new Date(l.service_date).toLocaleDateString()}</td>
                    <td>{l.notes || '—'}</td>
                    {canEditMaint && (
                      <td>
                        <div className="action-group">
                          {isInShop && (
                            <button className="btn btn-sm btn-success" onClick={() => handleCompleteService(l.id)}>
                              ✅ Complete Service
                            </button>
                          )}
                          {!isInShop && (
                            <span className="text-muted" style={{ fontSize: 12 }}>Service done</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {mainLogs.length === 0 && <div className="empty-state">No maintenance logs</div>}
        </div>
      )}

      {/* Fuel Table */}
      {tab === 'fuel' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Trip</th>
                <th>Liters</th>
                <th>Cost/L</th>
                <th>Total Cost</th>
                <th>Odometer</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map(l => (
                <tr key={l.id}>
                  <td>{l.vehicle?.name || '—'}<br/><small className="text-muted">{l.vehicle?.license_plate}</small></td>
                  <td>
                    {l.trip
                      ? <span>{l.trip.origin} → {l.trip.destination}<br/><small className="text-muted">{l.trip.status}</small></span>
                      : <span className="text-muted">—</span>
                    }
                  </td>
                  <td>{Number(l.liters).toFixed(1)} L</td>
                  <td>₹{Number(l.cost_per_liter).toFixed(2)}</td>
                  <td><strong>₹{Number(l.total_cost).toLocaleString()}</strong></td>
                  <td>{l.odometer_reading ? `${Number(l.odometer_reading).toLocaleString()} km` : '—'}</td>
                  <td>{new Date(l.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {fuelLogs.length === 0 && <div className="empty-state">No fuel logs</div>}
        </div>
      )}
    </div>
  );
}
