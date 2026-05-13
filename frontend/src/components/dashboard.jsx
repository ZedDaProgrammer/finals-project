import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; 

const Dashboard = () => {
 
    const { user, token, logout } = useAuth();
    
    const [dashboardData, setDashboardData] = useState({
        availablePCs: 0,
        availableVipPCs: 0, 
        userTotalBooked: 0,
        orderHistory: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [rawSessions, setRawSessions] = useState([]); 
    const [currentTime, setCurrentTime] = useState(new Date()); 
    const [isLoading, setIsLoading] = useState(true);

   
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const BASE_URL = 'http://localhost:3000/src/reservationRoute';
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

  
                const statsRes = await fetch(`${BASE_URL}/stats`, { 
                    headers,
                cache: 'no-store'     });
                if (statsRes.status === 401) {
                    logout(); 
                    return;
                }
                if (!statsRes.ok) throw new Error("Stats fetch failed");
                const stats = await statsRes.json();

                
              
                const dashboardRes = await fetch(`${BASE_URL}/dashboard`, { 
                    headers,
                    cache: 'no-store'
                 });
                const dashboard = await dashboardRes.json();

         
                const historyRes = await fetch(`${BASE_URL}/history`, { 
                    headers,
                     cache: 'no-store' });
                const history = await historyRes.json();
                
                setDashboardData({
           
                    availablePCs: Number(stats.availableStandardPc) || 0,
                    
                    availableVipPCs: Number(stats.availableVipPc) || 0,
                    
                    userTotalBooked: Number(stats.totalBookedPc) || 0,
                    orderHistory: Number(history.count) || 0 
                });

                if (dashboard.activeSessions) {
                    setRawSessions(dashboard.activeSessions); // Just save it straight to state!
                }

                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setIsLoading(false);
            }
        };

        if (token) fetchDashboardData();
    }, [token, logout]);

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>BlackByte</h2>
                </div>
                
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item active">Dashboard</a>
                        <a href="/booking" className="nav-item">Reservation</a>
                        {user?.role === 'admin' && (
                            <a href="/admin" className="nav-item admin-item active">Admin Panel</a>
                        )}                    
                    </div>

                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item">Profile</a>
                        <a href="/settings" className="nav-item">Settings</a>
                        <button onClick={logout} className="nav-item logout-btn">Logout</button>
                    </div>
                </nav>
            </aside>


            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1>Welcome back, {user?.username || 'User'}!</h1>
                    <p>Live status of BlackByte.</p>
                </header>


                <div className="widgets-grid">
                    <div className="widget-card">
                        <div className="widget-icon standard-pc">🖥️</div>
                        <div className="widget-info">
                            <h3>Available PC</h3>
                            <p className="widget-value">
                                {isLoading ? '...' : dashboardData.availablePCs}
                            </p>
                            <span className="widget-desc">Standard Units</span>
                        </div>
                    </div>
                    <div className="widget-card">
                        <div className="widget-icon vip-pc">⭐</div>
                        <div className="widget-info">
                            <h3>Available VIP PC</h3>
                            <p className="widget-value">
                                {isLoading ? '...' : dashboardData.availableVipPCs}
                            </p>
                            <span className="widget-desc">High-End Units</span>
                        </div>
                    </div>
                    <div className="widget-card">
                        <div className="widget-icon booked">📅</div>
                        <div className="widget-info">
                            <h3>Total Booked</h3>
                            <p className="widget-value">
                                {isLoading ? '...' : dashboardData.userTotalBooked}
                            </p>
                            <span className="widget-desc">Your past sessions</span>
                        </div>
                    </div>
                </div>


                <section className="recent-activity-panel">
                    <div className="panel-header">
                        <h2>Your Active Sessions</h2>
                        <button className="view-all-btn">Refresh</button>
                    </div>
                    
                    <div className="table-container">
                        {isLoading ? (
                            <p style={{textAlign: 'center', padding: '20px', color: '#8892a0'}}>Loading active sessions...</p>
                        ) : rawSessions.filter(res => res.status === 'pending' || new Date(res.formatted_end || res.end) > currentTime).length === 0 ? (
                            <p style={{textAlign: 'center', padding: '20px', color: '#8892a0'}}>You have no active PC sessions right now.</p>
                        ) : (
                            <table className="activity-table">
                                <thead>
                                    <tr>
                                        <th>Reservation ID</th>
                                        <th>PC Details</th>
                                        <th>Reserved Time</th>
                                        <th>Duration / Time Left</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 1. Added .filter() so rows delete themselves when time hits 0 (currentTime passes end time) */}
                                    {rawSessions
                                        .filter(res => res.status === 'pending' || new Date(res.formatted_end || res.end) > currentTime)
                                        .map((res) => {
                                        
                                        const startTimeStr = res.formatted_start || res.start;
                                        const endTimeStr = res.formatted_end || res.end;
                                        const start = new Date(startTimeStr);
                                        const end = new Date(endTimeStr);

                                        let statusStr = "";
                                        let badgeClass = "";
                                        let timeColor = ""; 
                                        let displayTimeStr = "";

                                        // Calculate total allotted time for Pending/Upcoming
                                        const durationHours = Math.round((end - start) / 3600000);
                                        const allottedTimeStr = `${durationHours} Hour${durationHours > 1 ? 's' : ''}`;

                                        if (res.status === 'pending') {
                                            statusStr = "Pending";
                                            badgeClass = "pending";
                                            timeColor = "gray";
                                            displayTimeStr = allottedTimeStr;
                                        } 
                                        else if (currentTime < start) {
                                            statusStr = "Upcoming";
                                            badgeClass = "upcoming"; 
                                            timeColor = "#0056b3";  
                                            displayTimeStr = allottedTimeStr;
                                        } 
                                        else if (currentTime >= start && currentTime < end) {
                                            statusStr = "Active";
                                            badgeClass = "active";   
                                            timeColor = "#28a745"; 
                                            
                                            // 2. Live Countdown logic for running sessions
                                            const diffMs = end - currentTime;
                                            const hours = Math.floor(diffMs / 3600000);
                                            const mins = Math.floor((diffMs % 3600000) / 60000);
                                            const secs = Math.floor((diffMs % 60000) / 1000);
                                            
                                            displayTimeStr = `${hours}h ${mins}m ${secs}s`;
                                        }

                                        return (
                                            <tr key={res.reservation_id}>
                                                <td className="fw-bold">#RES-{res.reservation_id}</td>
                                                <td>{(res.computer_type || 'Unknown').toUpperCase()} PC (Station {res.station_id})</td>
                                                <td>{start.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</td>
                                                
                                                {/* Dynamically shows fixed duration OR live countdown */}
                                                <td className="fw-bold" style={{ color: timeColor, fontVariantNumeric: 'tabular-nums' }}>
                                                    {displayTimeStr}
                                                </td>
                                                
                                                <td>
                                                    <span className={`status-badge ${badgeClass}`}>
                                                        {statusStr}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Dashboard;