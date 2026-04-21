import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const studentLinks = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/applications', icon: '📋', label: 'Applications' },
  { to: '/ai', icon: '🤖', label: 'AI Assistant' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const adminLinks = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/admin', icon: '🏢', label: 'Admin Panel' },
  { to: '/applications', icon: '📋', label: 'Applications' },
  { to: '/ai', icon: '🤖', label: 'AI Assistant' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🎯</div>
        <div>
          <div className="logo-text">APT</div>
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
            <span className="sidebar-link-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.avatar ? <img src={user.avatar} alt="avatar" /> : user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role === 'admin' ? '🛡 Admin' : '🎓 Student'}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}
