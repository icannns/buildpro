import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - attach JWT token and user info
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add user info headers for RBAC (required by Budget Service Java)
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                config.headers['x-user-id'] = user.id || '';
                config.headers['x-user-email'] = user.email || '';
                config.headers['x-user-role'] = user.role || '';

                // DEBUG: Log headers being sent
                console.log('🔍 API Request Headers:', {
                    url: config.url,
                    userId: config.headers['x-user-id'],
                    userEmail: config.headers['x-user-email'],
                    userRole: config.headers['x-user-role']
                });
            } catch (err) {
                console.error('Failed to parse user data:', err);
            }
        } else {
            console.warn('⚠️ No user data in localStorage!');
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
