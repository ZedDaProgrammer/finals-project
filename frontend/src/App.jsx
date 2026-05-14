import { useEffect } from 'react'; 
import LandingPage from './components/landingPage'; 
import AuthPage from './components/authPage';
import Dashboard from './components/dashboard';
import ReservationPage from './components/reservationPage';
import Protected from './protectedRoute';
import Settings from './components/settingsPage';
import ProfilePage from './components/profilePage';
import { Routes, Route, Navigate } from 'react-router-dom'; // Added Navigate
import AdminPanel from './components/adminPanel';

function App() {
    // Check if the user is currently logged in
    const isAuthenticated = !!localStorage.getItem('token');

    useEffect(() => {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, []);

    return (
        <Routes>
            <Route 
                path="/" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
            />
            <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
            />                   
 
            <Route element={<Protected />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/booking" element={<ReservationPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/settings" element={<Settings />} />
            </Route>   

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;