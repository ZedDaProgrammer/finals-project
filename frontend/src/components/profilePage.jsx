import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../pictures/logo.png';

const ProfilePage = () => {
    const { user, token, logout } = useAuth();
    
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    const BASE_URL = `${API_URL}/api/reservation`;

    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);


    const points = user?.points || 0;
    const credits = user?.credits || 0;


    const evaluatePoints = (points) => {
        if(points >= 350) return 'Radiant';
        if(points >= 175) return 'Platinum';
        if(points >= 75) return 'Gold';
        if(points >= 25) return 'Silver';
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

    const completedHistory = history.filter(res => {
        const end = new Date(res.end);
        const now = new Date();
        return res.status !== 'cancelled' && now > end;
    });
    const handleLogout = () => {
        localStorage.removeItem('token'); 
        navigate('/login', { replace: true }); 
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src={logoImg} alt="BlackByte Logo" className="brand-logo" style={{ margin: '0 auto' }} />
                </div>
                
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item">Dashboard</a>
                        <a href="/booking" className="nav-item">Reservation</a>
                        {user?.role === 'admin' && (
                            <a href="/admin" className="nav-item admin-item active">Admin Panel</a>
                        )}
                    </div>

                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item active">Profile</a>
                        <a href="/settings" className="nav-item">Settings</a>
                        <button onClick={handleLogout} className="nav-item logout-btn">Logout</button>
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
                                <strong>Credits:</strong> {credits} CR
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="history-section">
                        <h2>Reservation History</h2>
                        <div className="table-container">
                            {isLoading ? (
                                <p style={{textAlign: 'center', padding: '20px'}}>Loading history...</p>
                            ) : completedHistory.length === 0 ? (
                                <p style={{textAlign: 'center', padding: '20px'}}>You have no completed reservations.</p>
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
                                        {completedHistory.map((res) => {
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
                                                        {/* Since we filtered, we know the status is always COMPLETED */}
                                                        <span className="status-badge completed">
                                                            COMPLETED
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