import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
    (config) => {
        // Get Firebase auth token from localStorage or session
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('firebaseToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;