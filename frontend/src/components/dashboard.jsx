import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Monitor, Star, Calendar, LayoutDashboard, CalendarDays, Shield, User, Settings, LogOut } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Dashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [dashboardData, setDashboardData] = useState({ availablePCs: 0, availableVipPCs: 0, userTotalBooked: 0, orderHistory: 0 });
    const [rawSessions, setRawSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const BASE_URL = `${API_URL}/api/reservation`;
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            // Fetch stats, active sessions, and history in parallel
            const [statsRes, dashboardRes, historyRes] = await Promise.all([
                fetch(`${BASE_URL}/stats`, { headers, cache: 'no-store' }),
                fetch(`${BASE_URL}/dashboard`, { headers, cache: 'no-store' }),
                fetch(`${BASE_URL}/history`, { headers, cache: 'no-store' })
            ]);

            if (statsRes.status === 401) return logout();
            if (!statsRes.ok || !dashboardRes.ok || !historyRes.ok) {
                throw new Error("One or more dashboard requests failed");
            }

            const [stats, dashboard, history] = await Promise.all([
                statsRes.json(),
                dashboardRes.json(),
                historyRes.json()
            ]);

            setDashboardData({
                availablePCs: Number(stats.availableStandardPc) || 0,
                availableVipPCs: Number(stats.availableVipPc) || 0,
                userTotalBooked: Number(stats.totalBookedPc) || 0,
                orderHistory: Number(history.count) || 0
            });

            if (dashboard.activeSessions) setRawSessions(dashboard.activeSessions);
            setIsLoading(false);
        } catch (error) {
            if (import.meta.env.DEV) console.error("Error fetching data:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        document.title = "BlackByte | Dashboard";
        if (token) fetchDashboardData();
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        logout();
        navigate('/', { replace: true });
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
                        <a href="/dashboard" className="nav-item active"><LayoutDashboard size={18} /> Dashboard</a>
                        <a href="/booking" className="nav-item"><CalendarDays size={18} /> Reservation</a>
                        {user?.role === 'admin' && <a href="/admin" className="nav-item admin-item"><Shield size={18} /> Admin Panel</a>}
                    </div>
                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item"><User size={18} /> Profile</a>
                        <a href="/settings" className="nav-item"><Settings size={18} /> Settings</a>
                        <button onClick={handleLogout} className="nav-item logout-btn"><LogOut size={18} /> Logout</button>
                    </div>
                </nav>
            </aside>

            <main className="dashboard-content">
                <div className="dashboard-grid-container">
                    <div className="dashboard-main-col">
                        <div className="welcome-banner-card">
                            <div className="welcome-banner-text">
                                <span className="welcome-badge">MEMBER DASHBOARD</span>
                                <h1>Welcome back, {user?.username || 'User'}!</h1>
                                <p>Ready for your next gaming session? Book your high-performance PC setup now, or manage your active reservations below.</p>
                                <button className="banner-cta-btn" onClick={() => navigate('/booking')}>Book a PC Session</button>
                            </div>
                            <div className="welcome-banner-graphic">
                                <div className="banner-glow-circle"></div>
                                <LayoutDashboard size={100} className="banner-bg-icon" />
                            </div>
                        </div>

                        <section className="recent-activity-panel">
                            <div className="panel-header">
                                <h2>Your Active Sessions</h2>
                                <button className="view-all-btn" onClick={fetchDashboardData}>Refresh</button>
                            </div>
                            <div className="table-container">
                                {isLoading ? (
                                    <table className="activity-table">
                                        <tbody>
                                            {[1, 2].map(n => (
                                                <tr key={n}>
                                                    <td><div className="shimmer-bg" style={{ height: '18px', width: '70px', borderRadius: '4px' }} /></td>
                                                    <td><div className="shimmer-bg" style={{ height: '18px', width: '150px', borderRadius: '4px' }} /></td>
                                                    <td><div className="shimmer-bg" style={{ height: '18px', width: '90px', borderRadius: '4px' }} /></td>
                                                    <td><div className="shimmer-bg" style={{ height: '18px', width: '100px', borderRadius: '4px' }} /></td>
                                                    <td><div className="shimmer-bg" style={{ height: '22px', width: '60px', borderRadius: '12px' }} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <ActiveSessionsTable rawSessions={rawSessions} />
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="dashboard-side-col">
                        <div className="side-widget-header">
                            <h3>Live Station Status</h3>
                            <p>Real-time machine availability</p>
                        </div>
                        
                        <div className="side-widget-card pc-stats-card">
                            <div className="stat-card-row">
                                <div className="widget-icon standard-pc"><Monitor size={24} /></div>
                                <div className="widget-info">
                                    <h3>Available PC</h3>
                                    {isLoading ? <div className="shimmer-bg" style={{ height: '28px', width: '50px', borderRadius: '4px', marginTop: '4px' }} /> : <p className="widget-value">{dashboardData.availablePCs}</p>}
                                    <span className="widget-desc">Standard Lounge Units</span>
                                </div>
                            </div>
                        </div>

                        <div className="side-widget-card pc-stats-card">
                            <div className="stat-card-row">
                                <div className="widget-icon vip-pc"><Star size={24} /></div>
                                <div className="widget-info">
                                    <h3>Available VIP PC</h3>
                                    {isLoading ? <div className="shimmer-bg" style={{ height: '28px', width: '50px', borderRadius: '4px', marginTop: '4px' }} /> : <p className="widget-value">{dashboardData.availableVipPCs}</p>}
                                    <span className="widget-desc">Premium High-End Units</span>
                                </div>
                            </div>
                        </div>

                        <div className="side-widget-card total-booked-card">
                            <div className="stat-card-row">
                                <div className="widget-icon booked"><Calendar size={24} /></div>
                                <div className="widget-info">
                                    <h3>Total Booked</h3>
                                    {isLoading ? <div className="shimmer-bg" style={{ height: '28px', width: '50px', borderRadius: '4px', marginTop: '4px' }} /> : <p className="widget-value">{dashboardData.userTotalBooked}</p>}
                                    <span className="widget-desc">Your past sessions</span>
                                </div>
                            </div>
                            <div className="card-footer-action">
                                <p>Check your receipts and session details in profile history.</p>
                                <button className="widget-action-btn" onClick={() => navigate('/profile')}>View History</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const ActiveSessionsTable = ({ rawSessions }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Smooth 1-second countdown updates
        return () => clearInterval(timer);
    }, []);

    const activeSessions = rawSessions.filter(res => {
        const end = new Date(res.end);
        const GRACE_PERIOD_MS = 30 * 60 * 1000;
        
        if (res.status === 'pending') {
            return end > currentTime;
        }
        if (res.status === 'active') {
            return end > currentTime || (currentTime - end) <= GRACE_PERIOD_MS;
        }
        return false;
    });

    if (activeSessions.length === 0) {
        return <p style={{ textAlign: 'center', padding: '20px', color: '#8892a0' }}>You have no active PC sessions right now.</p>;
    }

    return (
        <table className="activity-table">
            <thead>
                <tr><th>Reservation ID</th><th>PC Details</th><th>Reserved Time</th><th>Duration / Time Left</th><th>Status</th></tr>
            </thead>
            <tbody>
                {activeSessions.map((res) => {
                    const start = new Date(res.start);
                    const end = new Date(res.end);
                    const now = currentTime;
                    let statusStr = "";
                    let badgeClass = "";
                    let timeColor = "";
                    let displayTimeStr = "";
                    const durationHours = Math.round((end - start) / 3600000);
                    const allottedTimeStr = `${durationHours} Hour${durationHours > 1 ? 's' : ''}`;
                    const GRACE_PERIOD_MS = 30 * 60 * 1000;
                    const timeOverMs = now - end;
                    const isInGracePeriod = timeOverMs > 0 && timeOverMs <= GRACE_PERIOD_MS;

                    if (res.status === 'pending') {
                        statusStr = "Pending";
                        badgeClass = "pending";
                        timeColor = "gray";
                        displayTimeStr = allottedTimeStr;
                    } else if (res.status === 'active' && now < start) {
                        statusStr = "Upcoming";
                        badgeClass = "upcoming";
                        timeColor = "#0056b3";
                        displayTimeStr = allottedTimeStr;
                    } else if (res.status === 'active' && now >= start && now < end) {
                        statusStr = "Active";
                        badgeClass = "active";
                        timeColor = "#28a745";
                        const diffMs = end - now;
                        const hours = Math.floor(diffMs / 3600000);
                        const mins = Math.floor((diffMs % 3600000) / 60000);
                        const secs = Math.floor((diffMs % 60000) / 1000);
                        displayTimeStr = `${hours}h ${mins}m ${secs}s`;
                    } else if (isInGracePeriod) {
                        statusStr = "Grace Period";
                        badgeClass = "completed";
                        timeColor = "#ff0000";
                        const remainingMs = GRACE_PERIOD_MS - timeOverMs;
                        const mins = Math.floor(remainingMs / 60000);
                        const secs = Math.floor((remainingMs % 60000) / 1000);
                        displayTimeStr = `${mins}m ${secs}s left`;
                    } else {
                        statusStr = "Expired";
                        badgeClass = "completed";
                        timeColor = "#f44336";
                        displayTimeStr = "0h 0m 0s";
                    }

                    return (
                        <tr key={res.reservation_id}>
                            <td className="fw-bold">#RES-{res.reservation_id}</td>
                            <td>{(res.computer_type || 'Unknown').toUpperCase()} PC (Station {res.station_id})</td>
                            <td>{start.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="fw-bold" style={{ color: timeColor, fontVariantNumeric: 'tabular-nums' }}>{displayTimeStr}</td>
                            <td><span className={`status-badge ${badgeClass}`}>{statusStr}</span></td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default Dashboard;