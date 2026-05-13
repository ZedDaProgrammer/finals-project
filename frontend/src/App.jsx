import AuthPage from './components/authPage';
import Dashboard from './components/dashboard';
import ReservationPage from './components/reservationPage';
import Protected from './protectedRoute';
import ProfilePage from './components/profilePage';
import { Routes, Route } from 'react-router-dom';
import AdminPanel from './components/adminPanel';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<AuthPage />} /> 
            
            <Route element={<Protected />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/booking" element={<ReservationPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPanel />} />
            </Route>   
        </Routes>
    );
}

export default App;