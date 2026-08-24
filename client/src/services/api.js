import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables sending and receiving HttpOnly cookies across origins
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Access Token from SessionStorage
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401 using HttpOnly Cookie
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const isAuthEndpoint = originalRequest.url && (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh'));
    if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const refreshEndpoint = API_BASE_URL.endsWith('/')
          ? `${API_BASE_URL}auth/refresh`
          : `${API_BASE_URL}/auth/refresh`;
        const res = await axios.post(refreshEndpoint, {}, { withCredentials: true });
        const { accessToken } = res.data;
        sessionStorage.setItem('accessToken', accessToken);

        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
