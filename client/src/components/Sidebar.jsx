import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Sidebar.css';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/applications', label: 'Applications' },
  { to: '/skills', label: 'Skill Tracker' },
  { to: '/ai', label: 'AI Assistant' },
  { to: '/profile', label: 'Profile' },
];

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/admin', label: 'Admin Panel' },
  { to: '/applications', label: 'Applications' },
  { to: '/skills', label: 'Skill Tracker' },
  { to: '/ai', label: 'AI Assistant' },
  { to: '/profile', label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">T</div>
        <div>
          <div className="logo-text">TrackHire</div>
          <div className="logo-sub">AI Placement Tracker</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-notif-row">
        <NotificationBell />
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.avatar ? <img src={user.avatar} alt="avatar" /> : user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role === 'admin' ? 'Admin' : 'Student'}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">Exit</button>
      </div>
    </aside>
  );
}
