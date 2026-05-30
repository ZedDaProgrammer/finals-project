import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(!!localStorage.getItem('token'));
    
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    // POLISH: Wrapped in useCallback so it can be exposed and safely utilized as a React dependency
    const fetchUser = useCallback(async () => {
        if (token) {
            setIsAuthLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    setUser({ isAuthenticated: true, ...userData }); 
                } else {
                    logout();
                }
            } catch (error) {
                if (import.meta.env.DEV) console.error("Failed to fetch user:", error);
                setUser({ isAuthenticated: true }); 
            } finally {
                setIsAuthLoading(false);
            }
        } else {
            setUser(null);
            setIsAuthLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = useCallback((newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    }, []);



    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshUser: fetchUser, isAuthLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);