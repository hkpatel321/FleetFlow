import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target } from 'lucide-react';
import { ROLE_LABELS, ROLE_ICONS, ROLE_COLORS } from '../config/roles';

const DEMO_ACCOUNTS = [
  { email: 'admin@fleetflow.com', role: 'fleet_manager' },
  { email: 'dispatcher@fleetflow.com', role: 'dispatcher' },
  { email: 'safety@fleetflow.com', role: 'safety_officer' },
  { email: 'finance@fleetflow.com', role: 'financial_analyst' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const quickLogin = (account) => {
    setEmail(account.email);
    setPassword('password123');
  };

  return (
    <div className="login-page">
      {/* Animated Background Waves */}
      <div className="login-wave-container">
        <div className="login-wave login-wave3"></div>
        <div className="login-wave login-wave2"></div>
        <div className="login-wave login-wave1"></div>
      </div>

      <div className="login-container" style={{ maxWidth: 480 }}>
        <div className="login-header">
          <div className="login-logo"><Target size={48} color="#1e36be" /></div>
          <h1>FleetFlow</h1>
          <p>Fleet & Logistics Management System</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" required autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Role Quick-Login Cards */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12 }}>
            Quick login — click a role card
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => quickLogin(acc)}
                style={{
                  background: email === acc.email
                    ? `${ROLE_COLORS['fleet_manager']}22`
                    : 'rgba(0,0,0,0.03)',
                  border: `1.5px solid ${email === acc.email ? ROLE_COLORS['fleet_manager'] : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: 10, padding: '12px 10px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4, color: ROLE_COLORS['fleet_manager'] }}>
                  {(() => {
                    const RoleIcon = ROLE_ICONS[acc.role];
                    return RoleIcon ? <RoleIcon size={20} /> : null;
                  })()}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: ROLE_COLORS['fleet_manager'] }}>
                  {ROLE_LABELS[acc.role]}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {acc.email}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
