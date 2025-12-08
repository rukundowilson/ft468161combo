import axios from 'axios';

// Determine API URL based on environment
// In development, use localhost. In production, use Render URL or env variable
const getApiBaseUrl = () => {
    // Check if environment variable is set (highest priority)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // In development, use localhost
    if (process.env.NODE_ENV === 'development' || 
        (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
        return 'http://localhost:8000/api';
    }
    
    // Production default
    return 'https://ft468161combo.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', process.env.NODE_ENV || 'unknown');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout (reasonable for both dev and prod)
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
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.config.url, response.status);
        return response;
    },
    async (error) => {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error('API Timeout:', error.config?.url);
            const isLocalhost = API_BASE_URL.includes('localhost');
            if (isLocalhost) {
                console.error('Local API server may not be running.');
                console.error('Please start the backend server: cd f468161tb && npm run dev');
            } else {
                console.error('The API server may be sleeping. Render free tier servers sleep after inactivity.');
                console.error('This can take 30-60 seconds to wake up. Please wait...');
            }
        } else {
            console.error('API Error:', error.config?.url, error.response?.status, error.message);
            if (error.response) {
                // Server responded with error
                console.error('Error data:', error.response.data);
            } else if (error.request) {
                // Request made but no response
                const isLocalhost = API_BASE_URL.includes('localhost');
                console.error('No response received - server may be down or unreachable');
                if (isLocalhost) {
                    console.error('Make sure the backend server is running on http://localhost:8000');
                }
            } else {
                // Error setting up request
                console.error('Error:', error.message);
            }
        }
        return Promise.reject(error);
    }
);

export default api;