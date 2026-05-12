import AuthPage from './components/authPage';
import Dashboard from './components/dashboard';
import ReservationPage from './components/reservationPage';
import Protected from './protectedRoute';
import { Routes, Route } from 'react-router-dom';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<AuthPage />} /> 
            
            <Route element={<Protected />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/booking" element={<ReservationPage />} />
            </Route>   
        </Routes>
    );
}

export default App;