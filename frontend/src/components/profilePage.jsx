import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
    const { user, token, logout } = useAuth();
    const BASE_URL = 'http://localhost:3000/src/reservationRoute';

    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Default to 0 if membership_points isn't loaded yet
    const points = user?.membership_points || 0;

    // Use your backend logic to evaluate rank
    const evaluatePoints = (points) => {
        if(points >= 100) return 'Radiant';
        if(points >= 60) return 'Platinum';
        if(points >= 30) return 'Gold';
        if(points >= 10) return 'Silver';
        return 'Bronze';
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${BASE_URL}/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data.history);
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchHistory();
    }, [token]);

    const rank = evaluatePoints(points);

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>BlackByte</h2>
                </div>
                
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item">Dashboard</a>
                        <a href="/reserve" className="nav-item">Reservation</a>
                        
                        {user?.role === 'admin' && (
                            <a href="/admin" className="nav-item admin-item">Admin Panel</a>
                        )}
                    </div>

                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item active">Profile</a>
                        <a href="/settings" className="nav-item">Settings</a>
                        <button onClick={logout} className="nav-item logout-btn">Logout</button>
                    </div>
                </nav>
            </aside>

            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1>My Profile</h1>
                    <p>Manage your account and view your past activity.</p>
                </header>

                <div className="profile-container">
                    {/* User Info Card */}
                    <div className="profile-card">
                        <div className="profile-avatar">
                            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="profile-details">
                            <h2>{user?.username}</h2>
                            <p>{user?.email}</p>
                            <div className="rank-badge">
                                <strong>Rank:</strong> <span className={`rank-${rank.toLowerCase()}`}>{rank}</span>
                            </div>
                            <div className="credits-badge">
                                <strong>Credits:</strong> {points} CR
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="history-section">
                        <h2>Reservation History</h2>
                        <div className="table-container">
                            {isLoading ? (
                                <p style={{textAlign: 'center', padding: '20px'}}>Loading history...</p>
                            ) : history.length === 0 ? (
                                <p style={{textAlign: 'center', padding: '20px'}}>You have no past reservations.</p>
                            ) : (
                                <table className="activity-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>PC Type</th>
                                            <th>Date & Time</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((res) => {
                                            const start = new Date(res.start);
                                            const end = new Date(res.end);
                                            const durationHrs = Math.round(Math.abs(end - start) / 36e5);

                                            return (
                                                <tr key={res.reservation_id}>
                                                    <td className="fw-bold">#RES-{res.reservation_id}</td>
                                                    <td>{(res.computer_type || 'Unknown').toUpperCase()} PC</td>
                                                    <td>{start.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td>{durationHrs} hour(s)</td>
                                                    <td>
                                                        <span className={`status-badge ${res.status === 'cancelled' ? 'cancelled' : 'confirmed'}`}>
                                                            {res.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;