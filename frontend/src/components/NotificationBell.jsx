import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../context/SocketContext'

const BELL_ICON = '\ud83d\udd14'
const TYPE_ICONS = {
  order: '\ud83d\uded2',
  info: '\u2139\ufe0f',
  alert: '\u26a0\ufe0f',
}

function relativeTime(value) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const unit = units.find(([, size]) => Math.abs(seconds) >= size)
  return unit
    ? formatter.format(Math.round(seconds / unit[1]), unit[0])
    : formatter.format(seconds, 'second')
}

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useSocket()
  const [isOpen, setIsOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const containerRef = useRef(null)
  const latestNotifications = notifications.slice(0, 10)

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  async function handleMarkRead(id) {
    setActionError('')
    try {
      await markAsRead(id)
    } catch {
      setActionError('Could not update this notification.')
    }
  }

  async function handleMarkAllRead() {
    setActionError('')
    try {
      await markAllAsRead()
    } catch {
      setActionError('Could not update notifications.')
    }
  }

  async function handleDelete(id) {
    setActionError('')
    try {
      await deleteNotification(id)
    } catch {
      setActionError('Could not delete this notification.')
    }
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        className="notification-bell-trigger"
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        title="Notifications"
        onClick={() => setIsOpen(open => !open)}
      >
        <span aria-hidden="true">{BELL_ICON}</span>
        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section className="notification-panel" aria-label="Notifications">
          <header className="notification-panel-header">
            <strong>Notifications</strong>
            <button
              type="button"
              className="notification-mark-all"
              disabled={unreadCount === 0}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </button>
          </header>
          {actionError && <p className="notification-error" role="alert">{actionError}</p>}
          {latestNotifications.length === 0 ? (
            <p className="notification-empty">No notifications</p>
          ) : (
            <ul className="notification-list">
              {latestNotifications.map(notification => (
                <li
                  className={`notification-item${notification.is_read ? '' : ' is-unread'}`}
                  key={notification.id}
                >
                  <button
                    type="button"
                    className="notification-content"
                    onClick={() => handleMarkRead(notification.id)}
                    aria-label={`${notification.is_read ? 'Read' : 'Unread'}: ${notification.message}`}
                  >
                    <span className="notification-type-icon" aria-hidden="true">
                      {TYPE_ICONS[notification.type] || TYPE_ICONS.info}
                    </span>
                    <span className="notification-copy">
                      <span className="notification-message">{notification.message}</span>
                      <time dateTime={notification.created_at}>
                        {relativeTime(notification.created_at)}
                      </time>
                    </span>
                    {!notification.is_read && <span className="notification-unread-dot" aria-label="Unread" />}
                  </button>
                  <button
                    type="button"
                    className="notification-delete"
                    aria-label="Delete notification"
                    title="Delete notification"
                    onClick={() => handleDelete(notification.id)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
