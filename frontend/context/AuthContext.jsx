import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
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
                    console.error("Failed to fetch user:", error);
                    setUser({ isAuthenticated: true }); 
                }
            } else {
                setUser(null);
            }
        };

        fetchUser();
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);