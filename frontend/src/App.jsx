import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Protected from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReservationPage = lazy(() => import('./pages/ReservationPage'));
const Settings = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

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
        <div className="loading-fallback">
            <div className="spinner-content">
                <h2>Loading Workspace...</h2>
                <p>Configuring terminal environment options...</p>
            </div>
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