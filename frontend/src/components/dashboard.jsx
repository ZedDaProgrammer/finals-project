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
                            <a href="/admin" className="nav-item admin-item">Admin Panel</a>
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
                        ) : rawSessions.length === 0 ? (
                            <p style={{textAlign: 'center', padding: '20px', color: '#8892a0'}}>You have no active PC sessions right now.</p>
                        ) : (
                            <table className="activity-table">
                                <thead>
                                    <tr>
                                        <th>Reservation ID</th>
                                        <th>PC Details</th>
                                        <th>Reserved Time</th>
                                        <th>Time Left</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawSessions.map((res) => {
                                        const startTimeStr = res.formatted_start || res.start;
                                        const endTimeStr = res.formatted_end || res.end;
                                        const start = new Date(startTimeStr);
                                        const end = new Date(endTimeStr);

                                        let statusStr = "";
                                        let timeLeftStr = "";
                                        let badgeClass = ""; // Maps directly to your style.css classes
                                        let timeColor = ""; 

                                        if (res.status === 'pending') {
                                            statusStr = "Pending";
                                            timeLeftStr = "Waiting to start in cafe";
                                            badgeClass = "pending";
                                            timeColor = "gray";
                                        } 
                                        else if (currentTime < start) {
                                            statusStr = "Upcoming";
                                            const diffMs = start - currentTime;
                                            const diffMins = Math.ceil(diffMs / 60000);
                                            timeLeftStr = `Starts in ${diffMins} min`;
                                            badgeClass = "upcoming"; // Connects to .status-badge.upcoming
                                            timeColor = "#0056b3";   // Matches your CSS blue
                                        } 
                                        else if (currentTime >= start && currentTime < end) {
                                            statusStr = "Active";
                                            const diffMs = end - currentTime;
                                            const diffMins = Math.ceil(diffMs / 60000);
                                            const hours = Math.floor(diffMins / 60);
                                            const mins = diffMins % 60;
                                            timeLeftStr = `${hours}h ${mins}m left`;
                                            badgeClass = "active";   // Connects to .status-badge.active
                                            timeColor = "#28a745";   // Matches your CSS green
                                        } 
                                        else {
                                            statusStr = "Expired";
                                            timeLeftStr = "0h 0m 0s";
                                            badgeClass = "completed"; // Connects to .status-badge.completed
                                            timeColor = "#f44336";    // Red for expired
                                        }

                                        return (
                                            <tr key={res.reservation_id}>
                                                <td className="fw-bold">#RES-{res.reservation_id}</td>
                                                <td>{(res.computer_type || 'Unknown').toUpperCase()} PC (Station {res.station_id})</td>
                                                <td>{start.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</td>
                                                {/* Safe inline styling without complex ternary checks */}
                                                <td className="fw-bold" style={{ color: timeColor }}>
                                                    {timeLeftStr}
                                                </td>
                                                <td>
                                                    {/* Safely injects the CSS class */}
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