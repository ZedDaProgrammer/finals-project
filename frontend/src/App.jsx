import { useEffect } from 'react'; // Added useEffect import
import AuthPage from './components/authPage';
import Dashboard from './components/dashboard';
import ReservationPage from './components/reservationPage';
import Protected from './protectedRoute';
import Settings from './components/settingsPage';
import ProfilePage from './components/profilePage';
import { Routes, Route } from 'react-router-dom';
import AdminPanel from './components/adminPanel';

function App() {
    useEffect(() => {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, []);

    return (
        <Routes>
            <Route path="/login" element={<AuthPage />} />            
            <Route element={<Protected />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/booking" element={<ReservationPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/settings" element={<Settings />} />
            </Route>   
        </Routes>
    );
}

export default App;