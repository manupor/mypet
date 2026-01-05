import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
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
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; phone?: string }) => 
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Pets
export const petsApi = {
  getMyPets: () => api.get('/pets/my-pets'),
  getPetDetail: (petId: string) => api.get(`/pets/my-pets/${petId}`),
};

// Medical Records
export const medicalApi = {
  getMyRecords: (petId?: string) => 
    api.get('/medical/my-records', { params: { petId } }),
};

// Vaccines
export const vaccinesApi = {
  getMyVaccines: (petId?: string) => 
    api.get('/vaccines/my-vaccines', { params: { petId } }),
  getReminders: () => api.get('/vaccines/my-reminders'),
};

// Loyalty
export const loyaltyApi = {
  getMyCards: () => api.get('/loyalty/my-cards'),
  getCardDetail: (veterinaryId: string) => 
    api.get(`/loyalty/my-cards/${veterinaryId}`),
};

// Services
export const servicesApi = {
  getMyServices: (petId?: string) => 
    api.get('/services/my-services', { params: { petId } }),
};

// Reports
export const reportsApi = {
  downloadPetCard: (petId: string) => 
    api.get(`/reports/pet-card/${petId}`, { responseType: 'blob' }),
  downloadMedicalReport: (petId: string) => 
    api.get(`/reports/medical-report/${petId}`, { responseType: 'blob' }),
};
