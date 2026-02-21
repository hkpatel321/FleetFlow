import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAccess, ROLE_LABELS, ROLE_ICONS, ROLE_COLORS } from '../config/roles';

// Map page paths to module keys in ACCESS_MATRIX
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊', module: 'dashboard' },
  { path: '/vehicles', label: 'Vehicles', icon: '🚛', module: 'vehicles' },
  { path: '/drivers', label: 'Drivers', icon: '👤', module: 'drivers' },
  { path: '/trips', label: 'Trips', icon: '🗺️', module: 'trips' },
  { path: '/maintenance', label: 'Maintenance', icon: '🔧', module: 'maintenance' },
  { path: '/fuel', label: 'Fuel Logs', icon: '⛽', module: 'fuel' },
  { path: '/reports', label: 'Reports', icon: '📋', module: 'reports' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter nav items by role access
  const visibleNavItems = NAV_ITEMS.filter(item => hasAccess(user?.role, item.module));

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            {sidebarOpen && <span className="logo-text">FleetFlow</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar" style={{ background: ROLE_COLORS[user?.role] || '#3b82f6' }}>
                {user?.role && ROLE_ICONS[user?.role] ? React.createElement(ROLE_ICONS[user?.role]) : (user?.email?.[0]?.toUpperCase())}
              </div>
              <div className="user-details">
                <span className="user-email">{user?.email}</span>
                <span className="user-role" style={{ color: ROLE_COLORS[user?.role] }}>
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            {sidebarOpen ? '🚪 Logout' : '🚪'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
