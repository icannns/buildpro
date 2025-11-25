import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                const { token, user } = response.data.data;

                // Save to state
                setToken(token);
                setUser(user);

                // Save to localStorage
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));

                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
