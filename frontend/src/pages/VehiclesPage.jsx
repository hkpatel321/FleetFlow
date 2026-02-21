import { useState, useEffect } from 'react';
import { vehiclesAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Available', 'On_Trip', 'In_Shop', 'Retired'];
const TYPE_OPTIONS = ['Truck', 'Van', 'Bike'];
const EMPTY_FORM = { name: '', model: '', license_plate: '', vehicle_type: 'Truck', max_capacity_kg: '', odometer_km: '', region: '' };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null); // null = create, object = editing
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // vehicle id to confirm delete
  const { isAuthorized } = useAuth();
  const canEdit = isAuthorized('fleet_manager');

  const fetchVehicles = async () => {
    try {
      const res = await vehiclesAPI.getAll();
      setVehicles(res.data.data.vehicles);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const openCreateForm = () => {
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      name: vehicle.name || '',
      model: vehicle.model || '',
      license_plate: vehicle.license_plate || '',
      vehicle_type: vehicle.vehicle_type || 'Truck',
      max_capacity_kg: vehicle.max_capacity_kg || '',
      odometer_km: vehicle.odometer_km || '',
      region: vehicle.region || '',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        max_capacity_kg: Number(form.max_capacity_kg),
        odometer_km: form.odometer_km ? Number(form.odometer_km) : undefined,
      };

      if (editingVehicle) {
        await vehiclesAPI.update(editingVehicle.id, payload);
      } else {
        await vehiclesAPI.create(payload);
      }
      closeForm();
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await vehiclesAPI.changeStatus(id, status);
      fetchVehicles();
    } catch (err) { alert(err.response?.data?.message || 'Status change failed'); }
  };

  const handleDelete = async (id) => {
    try {
      await vehiclesAPI.delete(id);
      setDeleteConfirm(null);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
      setDeleteConfirm(null);
    }
  };

  if (loading) return <div className="page-loading">Loading vehicles...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Vehicle Registry</h1>
          <p className="page-subtitle">{vehicles.length} vehicles in fleet</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => showForm ? closeForm() : openCreateForm()}>
            {showForm ? '✕ Cancel' : '+ Add Vehicle'}
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card form-card">
          <h3>{editingVehicle ? `Edit: ${editingVehicle.name}` : 'Add New Vehicle'}</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="inline-form" onSubmit={handleSubmit}>
            <input placeholder="Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <input placeholder="Model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
            <input placeholder="License Plate *" value={form.license_plate} onChange={e => setForm({...form, license_plate: e.target.value})} required />
            <select value={form.vehicle_type} onChange={e => setForm({...form, vehicle_type: e.target.value})}>
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Max Capacity (kg) *" type="number" value={form.max_capacity_kg} onChange={e => setForm({...form, max_capacity_kg: e.target.value})} required />
            <input placeholder="Odometer (km)" type="number" value={form.odometer_km} onChange={e => setForm({...form, odometer_km: e.target.value})} />
            <input placeholder="Region" value={form.region} onChange={e => setForm({...form, region: e.target.value})} />
            <button type="submit" className="btn btn-primary">{editingVehicle ? 'Update' : 'Create'}</button>
            {editingVehicle && <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>}
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Confirm Delete</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '12px 0' }}>
              Are you sure you want to delete vehicle <strong>"{deleteConfirm.name}"</strong> ({deleteConfirm.license_plate})?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete Vehicle</button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name / Model</th>
              <th>License Plate</th>
              <th>Type</th>
              <th>Max Capacity</th>
              <th>Odometer</th>
              <th>Region</th>
              <th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id}>
                <td><strong>{v.name}</strong><br/><small className="text-muted">{v.model}</small></td>
                <td><code>{v.license_plate}</code></td>
                <td><span className={`type-badge type-${v.vehicle_type.toLowerCase()}`}>{v.vehicle_type}</span></td>
                <td>{Number(v.max_capacity_kg).toLocaleString()} kg</td>
                <td>{Number(v.odometer_km).toLocaleString()} km</td>
                <td>{v.region || '—'}</td>
                <td><span className={`status-badge status-${v.status.toLowerCase().replace(/[_ ]/g, '-')}`}>{v.status.replace('_', ' ')}</span></td>
                {canEdit && (
                  <td>
                    <div className="action-group">
                      {/* Edit Button — disabled for Retired vehicles */}
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openEditForm(v)}
                        disabled={v.status === 'Retired'}
                        title={v.status === 'Retired' ? 'Cannot edit retired vehicles' : 'Edit vehicle'}
                      >
                        ✏️ Edit
                      </button>

                      {/* Retire / Restore toggle — the key "Out of Service" toggle */}
                      {v.status !== 'Retired' ? (
                        <button className="btn btn-sm btn-danger" onClick={() => handleStatusChange(v.id, 'Retired')} title="Mark as Out of Service">
                          🚫 Retire
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-outline" disabled title="Retired vehicles cannot be restored">
                          🚫 Retired
                        </button>
                      )}

                      {/* Delete Button — only for Available vehicles */}
                      {v.status === 'Available' && (
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(v)} title="Delete vehicle">
                          🗑️ Delete
                        </button>
                      )}

                      {/* Other status transitions */}
                      {v.status === 'Available' && (
                        <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(v.id, 'In_Shop')}>
                          → In Shop
                        </button>
                      )}
                      {v.status === 'In_Shop' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(v.id, 'Available')}>
                          → Available
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {vehicles.length === 0 && <div className="empty-state">No vehicles found. Add your first vehicle above.</div>}
      </div>
    </div>
  );
}
