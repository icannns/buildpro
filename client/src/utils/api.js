import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle 401 Unauthorized - redirect to login
            if (error.response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }

            // Handle other errors
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            console.error('Network Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
