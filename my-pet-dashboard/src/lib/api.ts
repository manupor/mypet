import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/staff/login', { email, password }),
  register: (data: any) => 
    api.post('/auth/veterinary/register', data),
};

// Veterinary
export const veterinaryApi = {
  getInfo: () => api.get('/veterinary'),
  updateInfo: (data: any) => api.put('/veterinary', data),
  getStats: () => api.get('/veterinary/stats'),
  getStaff: () => api.get('/veterinary/staff'),
  addStaff: (data: any) => api.post('/veterinary/staff', data),
  getServiceTypes: () => api.get('/veterinary/service-types'),
  addServiceType: (data: any) => api.post('/veterinary/service-types', data),
};

// Clients
export const clientsApi = {
  list: (params?: any) => api.get('/clients', { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  add: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
};

// Pets
export const petsApi = {
  list: (params?: any) => api.get('/pets', { params }),
  get: (id: string) => api.get(`/pets/${id}`),
  create: (data: any) => api.post('/pets', data),
  update: (id: string, data: any) => api.put(`/pets/${id}`, data),
  uploadPhoto: (id: string, formData: FormData) => 
    api.post(`/pets/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  createPassport: (id: string, data: any) => api.post(`/pets/${id}/passport`, data),
};

// Medical Records
export const medicalApi = {
  getByPet: (petId: string, params?: any) => api.get(`/medical/pet/${petId}`, { params }),
  get: (id: string) => api.get(`/medical/${id}`),
  create: (data: any) => api.post('/medical', data),
  update: (id: string, data: any) => api.put(`/medical/${id}`, data),
  delete: (id: string) => api.delete(`/medical/${id}`),
};

// Vaccines
export const vaccinesApi = {
  getByPet: (petId: string) => api.get(`/vaccines/pet/${petId}`),
  getPending: () => api.get('/vaccines/pending'),
  create: (data: any) => api.post('/vaccines', data),
  update: (id: string, data: any) => api.put(`/vaccines/${id}`, data),
  delete: (id: string) => api.delete(`/vaccines/${id}`),
};

// Services
export const servicesApi = {
  list: (params?: any) => api.get('/services', { params }),
  create: (data: any) => api.post('/services', data),
  getStats: (params?: any) => api.get('/services/stats', { params }),
};

// Loyalty
export const loyaltyApi = {
  getClient: (clientId: string) => api.get(`/loyalty/client/${clientId}`),
  addPoints: (data: any) => api.post('/loyalty/add-points', data),
  redeem: (data: any) => api.post('/loyalty/redeem', data),
  processService: (data: any) => api.post('/loyalty/process-service', data),
};

// Reports
export const reportsApi = {
  clientReport: (clientId: string) => 
    api.get(`/reports/client-report/${clientId}`, { responseType: 'blob' }),
};
