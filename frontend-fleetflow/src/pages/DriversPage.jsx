import { useState, useEffect } from 'react';
import { driversAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Edit2, Ban, Trash2 } from 'lucide-react';

const EMPTY_FORM = { full_name: '', phone: '', license_number: '', license_category: '', license_expiry_date: '' };

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [suspendResult, setSuspendResult] = useState(null);
  const { isAuthorized } = useAuth();
  const canEdit = isAuthorized('fleet_manager', 'safety_officer');

  const fetchDrivers = async () => {
    try {
      const res = await driversAPI.getAll();
      setDrivers(res.data.data.drivers);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const openCreateForm = () => {
    setEditingDriver(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (driver) => {
    setEditingDriver(driver);
    setForm({
      full_name: driver.full_name || '',
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      license_category: driver.license_category?.join(', ') || '',
      license_expiry_date: driver.license_expiry_date
        ? new Date(driver.license_expiry_date).toISOString().split('T')[0]
        : '',
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDriver(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation: expiry must be in the future
    if (new Date(form.license_expiry_date) < new Date()) {
      setError('License expiry date must be in the future.');
      return;
    }

    try {
      const payload = {
        ...form,
        license_category: form.license_category.split(',').map(c => c.trim()).filter(Boolean),
      };

      if (editingDriver) {
        await driversAPI.update(editingDriver.id, payload);
      } else {
        await driversAPI.create(payload);
      }
      closeForm();
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await driversAPI.changeStatus(id, status);
      fetchDrivers();
    } catch (err) { alert(err.response?.data?.message || 'Status change failed'); }
  };

  const handleAutoSuspend = async () => {
    try {
      const res = await driversAPI.autoSuspendExpired();
      const data = res.data.data;
      setSuspendResult(data);
      fetchDrivers();
      setTimeout(() => setSuspendResult(null), 5000);
    } catch (err) { alert(err.response?.data?.message || 'Auto-suspend failed'); }
  };

  if (loading) return <div className="page-loading">Loading drivers...</div>;

  const expiredCount = drivers.filter(d => d.license_expired && d.status !== 'Suspended').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Driver Management</h1>
          <p className="page-subtitle">{drivers.length} drivers registered</p>
        </div>
        <div className="action-group">
          {canEdit && expiredCount > 0 && (
            <button className="btn btn-danger" onClick={handleAutoSuspend}>
              ⚠️ Auto-Suspend Expired ({expiredCount})
            </button>
          )}
          {canEdit && (
            <button className="btn btn-primary" onClick={() => showForm ? closeForm() : openCreateForm()}>
              {showForm ? '✕ Cancel' : '+ Add Driver'}
            </button>
          )}
        </div>
      </div>

      {/* Auto-suspend result notification */}
      {suspendResult && (
        <div className="alert" style={{ background: 'var(--accent-warning-bg)', color: 'var(--accent-warning)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16 }}>
          {suspendResult.suspended === 0
            ? '✅ No drivers with expired licenses found.'
            : `🚫 Suspended ${suspendResult.suspended} driver(s): ${suspendResult.drivers.map(d => d.full_name).join(', ')}`
          }
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card form-card">
          <h3>{editingDriver ? `Edit: ${editingDriver.full_name}` : 'Add New Driver'}</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form className="inline-form" onSubmit={handleSubmit}>
            <input placeholder="Full Name *" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="License Number *" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} required />
            <input placeholder="Categories * (HMV, LMV, MCWG)" value={form.license_category} onChange={e => setForm({ ...form, license_category: e.target.value })} required />
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>License Expiry *</label>
              <input type="date" value={form.license_expiry_date} onChange={e => setForm({ ...form, license_expiry_date: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <button type="submit" className="btn btn-primary">{editingDriver ? 'Update' : 'Create'}</button>
            {editingDriver && <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>}
          </form>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Categories: HMV (Truck), LMV (Van/Truck), MCWG/MCWOG (Bike)
          </p>
        </div>
      )}

      {/* Drivers Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>License #</th>
              <th>Categories</th>
              <th>License Expiry</th>
              <th>Safety Score</th>
              <th>Trips</th>
              <th>Status</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => {
              const expired = d.license_expired || new Date(d.license_expiry_date) < new Date();
              return (
                <tr key={d.id} style={expired ? { background: 'rgba(239, 68, 68, 0.04)' } : {}}>
                  <td><strong>{d.full_name}</strong></td>
                  <td>{d.phone || '—'}</td>
                  <td><code>{d.license_number}</code></td>
                  <td>{d.license_category?.join(', ') || '—'}</td>
                  <td>
                    <span className={expired ? 'text-danger' : ''} style={{ fontWeight: expired ? 600 : 400 }}>
                      {new Date(d.license_expiry_date).toLocaleDateString()}
                      {expired && ' ⚠️ EXPIRED'}
                    </span>
                  </td>
                  <td>
                    <span className={`safety-score ${Number(d.safety_score) >= 90 ? 'score-good' : Number(d.safety_score) >= 70 ? 'score-mid' : 'score-low'}`}>
                      {Number(d.safety_score).toFixed(0)}
                    </span>
                  </td>
                  <td>{d.completed_trips}/{d.total_trips}</td>
                  <td><span className={`status-badge status-${d.status.toLowerCase().replace(/[_ ]/g, '-')}`}>{d.status.replace('_', ' ')}</span></td>
                  {canEdit && (
                    <td>
                      <div className="action-group">
                        {/* Edit */}
                        <button className="btn btn-sm btn-outline" onClick={() => openEditForm(d)} style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Edit2 size={14} style={{ marginRight: 4 }} /> Edit
                        </button>

                        {/* Suspend / Unsuspend */}
                        {d.status !== 'Suspended' && d.status !== 'On_Trip' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleStatusChange(d.id, 'Suspended')} style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <Ban size={14} style={{ marginRight: 4 }} /> Suspend
                          </button>
                        )}
                        {d.status === 'Suspended' && !expired && (
                          <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(d.id, 'Off_Duty')} style={{ display: 'inline-flex', alignItems: 'center' }}>
                            ✅ Reinstate
                          </button>
                        )}
                        {d.status === 'Suspended' && expired && (
                          <span style={{ fontSize: 11, color: 'var(--accent-danger)' }}>Renew license first</span>
                        )}

                        {/* On/Off Duty toggle */}
                        {d.status === 'Off_Duty' && !expired && (
                          <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(d.id, 'On_Duty')}>
                            → On Duty
                          </button>
                        )}
                        {d.status === 'On_Duty' && (
                          <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(d.id, 'Off_Duty')}>
                            → Off Duty
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {drivers.length === 0 && <div className="empty-state">No drivers found. Add your first driver above.</div>}
      </div>
    </div>
  );
}
