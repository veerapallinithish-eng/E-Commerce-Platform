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
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const res = await axios.post(
          `${apiBaseUrl}/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        )

        const newAccessToken = res.data.access_token
        localStorage.setItem('access_token', newAccessToken)
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
