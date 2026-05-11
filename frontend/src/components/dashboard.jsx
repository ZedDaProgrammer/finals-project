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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const BASE_URL = 'http://localhost:3000/src/reservationRoute';
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

  
                const statsRes = await fetch(`${BASE_URL}/stats`, { headers });
                if (statsRes.status === 401) {
                    logout(); 
                    return;
                }
                if (!statsRes.ok) throw new Error("Stats fetch failed");
                const stats = await statsRes.json();

              
                const dashboardRes = await fetch(`${BASE_URL}/dashboard`, { headers });
                const dashboard = await dashboardRes.json();

         
                const historyRes = await fetch(`${BASE_URL}/history`, { headers });
                const history = await historyRes.json();
                
                setDashboardData({
           
                    availablePCs: Number(stats.availableStandardPc) || 0,
                    
                    availableVipPCs: Number(stats.availableVipPc) || 0,
                    
                    userTotalBooked: Number(stats.totalBookedPc) || 0,
                    orderHistory: Number(history.count) || 0 
                });

                if (dashboard.activeSessions) {
                    const formattedSessions = dashboard.activeSessions.map(res => {
                        const endTime = new Date(res.end);
                        const now = new Date();
                        const diffMs = endTime - now; // Time left in milliseconds
                        
                        // Convert into Hours and Minutes
                        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        const timeLeft = `${diffHrs}h ${diffMins}m`;

                        return {
                            id: `#RES-${res.reservation_id}`,
                            pcDetails: `${(res.computer_type || 'Unknown').toUpperCase()} PC (Station ${res.station_id || 'N/A'})`,
                            endTime: endTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
                            timeLeft: diffMs > 0 ? timeLeft : 'Expired',
                            status: 'In Use'
                        };
                    });
                    setRecentOrders(formattedSessions);
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
                        <a href="/reservation" className="nav-item">Reservation</a>
                        <a href="/order-foods" className="nav-item">Order Foods</a>
                        
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
                    <div className="widget-card">
                        <div className="widget-icon orders">🍔</div>
                        <div className="widget-info">
                            <h3>Order History</h3>
                            <p className="widget-value">
                                {isLoading ? '...' : dashboardData.orderHistory}
                            </p>
                            <span className="widget-desc">Total Interactions</span>
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
                        ) : recentOrders.length === 0 ? (
                            <p style={{textAlign: 'center', padding: '20px', color: '#8892a0'}}>You have no active PC sessions right now.</p>
                        ) : (
                            <table className="activity-table">
                                <thead>
                                    <tr>
                                        <th>Reservation ID</th>
                                        <th>PC Details</th>
                                        <th>Ends At</th>
                                        <th>Time Left</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((session, index) => (
                                        <tr key={index}>
                                            <td className="fw-bold">{session.id}</td>
                                            <td>{session.pcDetails}</td>
                                            <td>{session.endTime}</td>
                                            {/* Style the time left to look like an active timer */}
                                            <td className="fw-bold" style={{ color: '#00e676' }}>
                                                {session.timeLeft}
                                            </td>
                                            <td>
                                                <span className="status-badge confirmed">
                                                    {session.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
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