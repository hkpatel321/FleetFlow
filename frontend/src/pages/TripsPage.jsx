import { useState, useEffect } from 'react';
import { tripsAPI, vehiclesAPI, driversAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [completeForm, setCompleteForm] = useState({ tripId: null, end_odometer: '', revenue: '', startOdometer: 0 });
  const [form, setForm] = useState({ vehicle_id: '', driver_id: '', origin: '', destination: '', cargo_weight_kg: '', cargo_description: '', revenue: 0 });
  const [error, setError] = useState('');
  const { isAuthorized } = useAuth();
  const canEdit = isAuthorized('fleet_manager', 'dispatcher');

  const fetchData = async () => {
    try {
      const [t, v, d] = await Promise.all([
        tripsAPI.getAll(), vehiclesAPI.getAll(), driversAPI.getAll(),
      ]);
      setTrips(t.data.data.trips);
      setVehicles(v.data.data.vehicles);
      setDrivers(d.data.data.drivers);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter: only Available vehicles for trip creation
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  // Filter: only On_Duty drivers with valid (non-expired) licenses
  const availableDrivers = drivers.filter(d =>
    d.status === 'On_Duty' && new Date(d.license_expiry_date) > new Date()
  );

  // Get the selected vehicle to show capacity info
  const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation: cargo weight vs capacity
    if (selectedVehicle && Number(form.cargo_weight_kg) > Number(selectedVehicle.max_capacity_kg)) {
      setError(`Cargo (${form.cargo_weight_kg}kg) exceeds vehicle capacity (${selectedVehicle.max_capacity_kg}kg).`);
      return;
    }

    try {
      await tripsAPI.create({ ...form, cargo_weight_kg: Number(form.cargo_weight_kg), revenue: Number(form.revenue || 0) });
      setShowForm(false);
      setForm({ vehicle_id: '', driver_id: '', origin: '', destination: '', cargo_weight_kg: '', cargo_description: '', revenue: 0 });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create'); }
  };

  const handleAction = async (action, id) => {
    try {
      if (action === 'dispatch') await tripsAPI.dispatch(id);
      if (action === 'cancel') await tripsAPI.cancel(id);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || `${action} failed`); }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (Number(completeForm.end_odometer) <= completeForm.startOdometer) {
      alert(`End odometer must be greater than start odometer (${completeForm.startOdometer} km).`);
      return;
    }
    try {
      await tripsAPI.complete(completeForm.tripId, {
        end_odometer: Number(completeForm.end_odometer),
        revenue: Number(completeForm.revenue) || undefined,
      });
      setCompleteForm({ tripId: null, end_odometer: '', revenue: '', startOdometer: 0 });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Complete failed'); }
  };

  if (loading) return <div className="page-loading">Loading trips...</div>;

  // Stats
  const draftCount = trips.filter(t => t.status === 'Draft').length;
  const dispatchedCount = trips.filter(t => t.status === 'Dispatched').length;
  const completedCount = trips.filter(t => t.status === 'Completed').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Trip Management</h1>
          <p className="page-subtitle">
            {trips.length} trips — {draftCount} draft, {dispatchedCount} dispatched, {completedCount} completed
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Create Trip'}
          </button>
        )}
      </div>

      {/* State Transition Reference */}
      <div className="card" style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Trip Flow:</span>
          <span className="status-badge status-draft">Draft</span>
          <span className="route-arrow">→</span>
          <span className="status-badge status-dispatched">Dispatched</span>
          <span className="route-arrow">→</span>
          <span className="status-badge status-completed">Completed</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>|</span>
          <span className="status-badge status-cancelled">Cancelled</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(from Draft or Dispatched)</span>
        </div>
      </div>

      {/* Create Trip Form */}
      {showForm && (
        <div className="card form-card">
          <h3>Create New Trip (Draft)</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="inline-form" onSubmit={handleCreate}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vehicle (Available only)</label>
              <select value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} required>
                <option value="">Select Vehicle</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate}) — {v.vehicle_type}, {Number(v.max_capacity_kg).toLocaleString()}kg
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Driver (On Duty, valid license)</label>
              <select value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})} required>
                <option value="">Select Driver</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.license_category?.join(', ')})
                  </option>
                ))}
              </select>
            </div>
            <input placeholder="Origin *" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} required />
            <input placeholder="Destination *" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} required />
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Cargo Weight (kg) {selectedVehicle && <span>/ max {Number(selectedVehicle.max_capacity_kg).toLocaleString()}kg</span>}
              </label>
              <input
                type="number"
                placeholder="Cargo Weight"
                value={form.cargo_weight_kg}
                onChange={e => setForm({...form, cargo_weight_kg: e.target.value})}
                max={selectedVehicle?.max_capacity_kg}
                required
              />
            </div>
            <input placeholder="Cargo Description" value={form.cargo_description} onChange={e => setForm({...form, cargo_description: e.target.value})} />
            <input placeholder="Revenue (₹)" type="number" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} />
            <button type="submit" className="btn btn-primary">Create Draft</button>
          </form>
        </div>
      )}

      {/* Complete Trip Modal */}
      {completeForm.tripId && (
        <div className="modal-overlay" onClick={() => setCompleteForm({ tripId: null, end_odometer: '', revenue: '', startOdometer: 0 })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Complete Trip</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Start odometer: <strong>{completeForm.startOdometer.toLocaleString()} km</strong>.
              Distance will be auto-calculated.
            </p>
            <form onSubmit={handleComplete}>
              <div className="form-group">
                <label>End Odometer (km) — must be &gt; {completeForm.startOdometer.toLocaleString()}</label>
                <input
                  type="number"
                  value={completeForm.end_odometer}
                  onChange={e => setCompleteForm({...completeForm, end_odometer: e.target.value})}
                  min={completeForm.startOdometer + 1}
                  required
                />
                {completeForm.end_odometer && Number(completeForm.end_odometer) > completeForm.startOdometer && (
                  <small style={{ color: 'var(--accent-success)', marginTop: 4 }}>
                    Distance: {(Number(completeForm.end_odometer) - completeForm.startOdometer).toLocaleString()} km
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Revenue (₹, optional update)</label>
                <input type="number" value={completeForm.revenue} onChange={e => setCompleteForm({...completeForm, revenue: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setCompleteForm({ tripId: null, end_odometer: '', revenue: '', startOdometer: 0 })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trips Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Cargo</th>
              <th>Distance</th>
              <th>Revenue</th>
              <th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id}>
                <td>
                  <strong>{t.origin}</strong>
                  <span className="route-arrow"> → </span>
                  <strong>{t.destination}</strong>
                  {t.dispatched_at && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Dispatched: {new Date(t.dispatched_at).toLocaleString()}
                    </div>
                  )}
                </td>
                <td>{t.vehicle?.name || '—'}<br/><small className="text-muted">{t.vehicle?.license_plate}</small></td>
                <td>{t.driver?.full_name || '—'}</td>
                <td>{Number(t.cargo_weight_kg).toLocaleString()} kg</td>
                <td>
                  {t.distance_km
                    ? <strong>{Number(t.distance_km).toLocaleString()} km</strong>
                    : t.status === 'Dispatched'
                      ? <span className="text-muted">In progress</span>
                      : <span className="text-muted">—</span>
                  }
                </td>
                <td>₹{Number(t.revenue || 0).toLocaleString()}</td>
                <td><span className={`status-badge status-${t.status.toLowerCase()}`}>{t.status}</span></td>
                {canEdit && (
                  <td>
                    <div className="action-group">
                      {t.status === 'Draft' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => handleAction('dispatch', t.id)}>🚀 Dispatch</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleAction('cancel', t.id)}>✕ Cancel</button>
                        </>
                      )}
                      {t.status === 'Dispatched' && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => setCompleteForm({
                            tripId: t.id,
                            end_odometer: '',
                            revenue: '',
                            startOdometer: Number(t.start_odometer || 0),
                          })}>✅ Complete</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleAction('cancel', t.id)}>✕ Cancel</button>
                        </>
                      )}
                      {(t.status === 'Completed' || t.status === 'Cancelled') && (
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {t.completed_at ? `Completed ${new Date(t.completed_at).toLocaleDateString()}` : 'Cancelled'}
                        </span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {trips.length === 0 && <div className="empty-state">No trips found. Create your first trip above.</div>}
      </div>
    </div>
  );
}
