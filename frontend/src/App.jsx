import { useEffect, lazy, Suspense } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom';
import Protected from './protectedRoute';

// Lazy load all major components
const LandingPage = lazy(() => import('./components/landingPage'));
const AuthPage = lazy(() => import('./components/authPage'));
const Dashboard = lazy(() => import('./components/dashboard'));
const ReservationPage = lazy(() => import('./components/reservationPage'));
const Settings = lazy(() => import('./components/settingsPage'));
const ProfilePage = lazy(() => import('./components/profilePage'));
const AdminPanel = lazy(() => import('./components/adminPanel'));

function App() {
    const isAuthenticated = !!localStorage.getItem('token');

    useEffect(() => {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, []);

    const LoadingSpinner = () => (
        <div className="loading-fallback" style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }}>
            <h2>Loading...</h2>
        </div>
    );

    return (
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
    );
}

export default App;