import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAccess, ROLE_LABELS, ROLE_ICONS, ROLE_COLORS } from '../config/roles';
import { Target, LayoutDashboard, Truck, Users, Map, Wrench, Fuel, FileText, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

// Map page paths to module keys in ACCESS_MATRIX
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, module: 'dashboard' },
  { path: '/vehicles', label: 'Vehicles', icon: <Truck size={20} />, module: 'vehicles' },
  { path: '/drivers', label: 'Drivers', icon: <Users size={20} />, module: 'drivers' },
  { path: '/trips', label: 'Trips', icon: <Map size={20} />, module: 'trips' },
  { path: '/maintenance', label: 'Maintenance', icon: <Wrench size={20} />, module: 'maintenance' },
  { path: '/fuel', label: 'Fuel Logs', icon: <Fuel size={20} />, module: 'fuel' },
  { path: '/reports', label: 'Reports', icon: <FileText size={20} />, module: 'reports' },
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
            <span className="logo-icon" style={{ display: 'flex', alignItems: 'center' }}><Target size={28} /></span>
            {sidebarOpen && <span className="logo-text">FleetFlow</span>}
          </div>
          <button className="sidebar-toggle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
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
          <button className="logout-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={20} style={{ marginRight: sidebarOpen ? 8 : 0 }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
