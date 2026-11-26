import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n._id !== notif._id)].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
    };
    socket.on('new_notification', handleNewNotification);
    return () => socket.off('new_notification', handleNewNotification);
  }, [socket]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      return;
    }
  };

  const handleOpenNotification = async (notif) => {
    setOpen(false);
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        setUnreadCount((prev) => prev);
      }
    }

    if (
      notif.bookingId &&
      (notif.link === '/incoming-orders' || notif.link === '/my-rentals')
    ) {
      navigate(`${notif.link}?bookingId=${notif.bookingId}`);
    } else {
      navigate(notif.link || '/dashboard');
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        className="relative p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-container text-on-primary text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl shadow-[0_12px_24px_-4px_rgba(41,37,36,0.14)] border border-surface-container overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-surface-container bg-surface-container-low flex items-center justify-between">
            <span className="text-label-md text-on-surface">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-label-sm text-primary hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-surface-container">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-body-sm text-on-surface-variant">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  type="button"
                  onClick={() => handleOpenNotification(notif)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                    notif.isRead ? 'bg-surface-container-lowest' : 'bg-primary-fixed/25'
                  } hover:bg-surface-container-low`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      notif.isRead ? 'bg-transparent' : 'bg-primary-container'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-label-md text-on-surface truncate">{notif.title}</p>
                    {notif.message && (
                      <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                    )}
                    <p className="text-[11px] text-outline mt-1">
                      {format(new Date(notif.createdAt), 'dd MMM, hh:mm a')}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
