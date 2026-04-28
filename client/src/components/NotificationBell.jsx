import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationBell.css';

const TYPE_ICON = {
  shortlisted: '🎉',
  interview:   '📅',
  offer:       '🏆',
  rejected:    '❌',
};

export default function NotificationBell() {
  const { notifications, unreadCount, handleMarkRead, handleMarkAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onClickNotif = async (n) => {
    if (!n.read) await handleMarkRead(n._id);
  };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        id="notification-bell-btn"
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
      >
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" id="notification-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  id={`notif-${n._id}`}
                  className={`notif-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => onClickNotif(n)}
                >
                  <span className="notif-type-icon">{TYPE_ICON[n.type] || '📢'}</span>
                  <div className="notif-content">
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {!n.read && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
