import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAccess, ROLE_LABELS, ROLE_ICONS, ROLE_COLORS } from '../config/roles';
import {
  BarChart3,
  Truck,
  Users,
  Map as MapIcon,
  Wrench,
  Fuel,
  ClipboardList,
  Target,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

// Map page paths to module keys in ACCESS_MATRIX
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: BarChart3, module: 'dashboard' },
  { path: '/vehicles', label: 'Vehicles', icon: Truck, module: 'vehicles' },
  { path: '/drivers', label: 'Drivers', icon: Users, module: 'drivers' },
  { path: '/trips', label: 'Trips', icon: MapIcon, module: 'trips' },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench, module: 'maintenance' },
  { path: '/fuel', label: 'Fuel Logs', icon: Fuel, module: 'fuel' },
  { path: '/reports', label: 'Reports', icon: ClipboardList, module: 'reports' },
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
            <span className="logo-icon"><Target size={26} color="#ffffff" /></span>
            {sidebarOpen && <span className="logo-text">FleetFlow</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon"><Icon size={20} /></span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar" style={{ background: ROLE_COLORS[user?.role] || '#3b82f6' }}>
                {(() => {
                  const RoleIcon = ROLE_ICONS[user?.role];
                  return RoleIcon ? <RoleIcon size={18} /> : user?.email?.[0]?.toUpperCase();
                })()}
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
            <LogOut size={16} style={{ marginRight: sidebarOpen ? '6px' : '0' }} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
