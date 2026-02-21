import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fleetflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fleetflow_token');
      localStorage.removeItem('fleetflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Vehicles ────────────────────────────────────────────
export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  changeStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status }),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

// ─── Drivers ─────────────────────────────────────────────
export const driversAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  changeStatus: (id, status) => api.patch(`/drivers/${id}/status`, { status }),
  autoSuspendExpired: () => api.post('/drivers/auto-suspend'),
};

// ─── Trips ───────────────────────────────────────────────
export const tripsAPI = {
  getAll: (params) => api.get('/trips', { params }),
  getById: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  dispatch: (id) => api.patch(`/trips/${id}/dispatch`),
  complete: (id, data) => api.patch(`/trips/${id}/complete`, data),
  cancel: (id) => api.patch(`/trips/${id}/cancel`),
};

// ─── Maintenance ─────────────────────────────────────────
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  completeService: (id) => api.patch(`/maintenance/${id}/complete`),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

// ─── Fuel ────────────────────────────────────────────────
export const fuelAPI = {
  getAll: (params) => api.get('/fuel', { params }),
  getById: (id) => api.get(`/fuel/${id}`),
  create: (data) => api.post('/fuel', data),
  getCostPerKm: () => api.get('/fuel/cost-per-km'),
  delete: (id) => api.delete(`/fuel/${id}`),
};

// ─── Analytics ───────────────────────────────────────────
export const analyticsAPI = {
  getFleetSummary: () => api.get('/analytics/fleet-summary'),
  getTripStats: () => api.get('/analytics/trip-stats'),
  getFuelCosts: () => api.get('/analytics/fuel-costs'),
  getMaintenanceCosts: () => api.get('/analytics/maintenance-costs'),
  getDriverPerformance: () => api.get('/analytics/driver-performance'),
  getFuelEfficiency: () => api.get('/analytics/fuel-efficiency'),
  getVehicleROI: () => api.get('/analytics/vehicle-roi'),
  getUtilizationRate: () => api.get('/analytics/utilization-rate'),
  getDeadStock: (days = 30) => api.get(`/analytics/dead-stock?days=${days}`),
};

export default api;
