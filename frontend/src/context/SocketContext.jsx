import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import api from '../api'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

function mergeNotifications(current, incoming) {
  const byId = new Map(current.map(notification => [notification.id, notification]))
  incoming.forEach(notification => byId.set(notification.id, notification))
  return [...byId.values()].sort((left, right) => (
    new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  ))
}

function getSocketUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL
  return configuredApiUrl
    ? new URL(configuredApiUrl).origin
    : `http://${window.location.hostname}:5000`
}

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setSocket(null)
      return undefined
    }

    let active = true
    const token = localStorage.getItem('access_token')
    const connection = io(getSocketUrl(), { auth: { token } })
    setSocket(connection)

    api.get('/notifications')
      .then(response => {
        if (active) {
          setNotifications(current => mergeNotifications(current, response.data))
        }
      })
      .catch(() => {
        if (active) setNotifications([])
      })

    connection.on('connect', () => {
      connection.emit('join', { user_id: user.id, role: user.role })
    })
    connection.on('new_notification', notification => {
      if (active) setNotifications(current => mergeNotifications(current, [notification]))
    })

    return () => {
      active = false
      connection.disconnect()
      setSocket(current => current === connection ? null : current)
    }
  }, [user])

  async function markAsRead(id) {
    const notification = notifications.find(item => item.id === id)
    if (!notification || notification.is_read) return
    await api.put(`/notifications/${id}/read`)
    setNotifications(current => current.map(item => (
      item.id === id ? { ...item, is_read: true } : item
    )))
  }

  async function markAllAsRead() {
    await api.put('/notifications/read-all')
    setNotifications(current => current.map(item => ({ ...item, is_read: true })))
  }

  async function deleteNotification(id) {
    await api.delete(`/notifications/${id}`)
    setNotifications(current => current.filter(item => item.id !== id))
  }

  const unreadCount = notifications.filter(notification => !notification.is_read).length

  return (
    <SocketContext.Provider value={{
      socket,
      notifications,
      setNotifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
