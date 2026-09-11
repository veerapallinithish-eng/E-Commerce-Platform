import axios from 'axios'

export const getImageUrl = imageUrl => {
  if (!imageUrl) return undefined
  return imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`
}

const apiHost = window.location.hostname
const apiServerHost = apiHost || 'localhost'
const apiBaseUrl = import.meta.env.VITE_API_URL || `http://${apiServerHost.includes(':') ? `[${apiServerHost}]` : apiServerHost}:5000/api`

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true // sends session cookie with every request
})

export default api
