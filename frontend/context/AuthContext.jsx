import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);


    useEffect(() => {
        if (token) {

            setUser({ isAuthenticated: true }); 
        } else {
            setUser(null);
        }
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