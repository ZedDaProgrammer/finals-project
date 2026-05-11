import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; 

const Dashboard = () => {
    // We bring in 'token' here to authenticate our API requests
    const { user, token, logout } = useAuth();
    
    const [dashboardData, setDashboardData] = useState({
        availablePCs: 0,
        availableVipPCs: 0, // Your backend currently groups all PCs, so this will act as a placeholder until the backend splits it
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
            
            // IF THE SERVER RETURNS 401 (UNAUTHORIZED)
            if (statsRes.status === 401) {
                console.warn("Token expired or invalid. Logging out...");
                logout(); // This clears localStorage and redirects the user
                return;
            }

            if (!statsRes.ok) throw new Error("Stats fetch failed");
            const stats = await statsRes.json();

            // ... repeat similar check for your other fetch calls (dashboardRes, historyRes)
            
            setDashboardData({
                availablePCs: Number(stats.availablePc) || 0,
                availableVipPCs: 4,
                userTotalBooked: Number(stats.totalBookedPc) || 0,
                orderHistory: Number(history.count) || 0 
            });

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (token) {
        fetchDashboardData();
    }
}, [token, logout]);

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>LAN Spot</h2>
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

            {/* Main Content */}
            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1>Welcome back, {user?.name || 'User'}!</h1>
                    <p>Here is the current status of the LAN center and your session history.</p>
                </header>

                {/* 4 Top Widgets */}
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

                {/* Order History Panel */}
                <section className="recent-activity-panel">
                    <div className="panel-header">
                        <h2>Upcoming Reservations</h2>
                        <button className="view-all-btn">View All</button>
                    </div>
                    
                    <div className="table-container">
                        {isLoading ? (
                            <p style={{textAlign: 'center', padding: '20px', color: '#8892a0'}}>Loading your reservations...</p>
                        ) : recentOrders.length === 0 ? (
                            <p style={{textAlign: 'center', padding: '20px', color: '#8892a0'}}>You have no upcoming reservations.</p>
                        ) : (
                            <table className="activity-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Type</th>
                                        <th>Details</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order, index) => (
                                        <tr key={index}>
                                            <td className="fw-bold">{order.id}</td>
                                            <td>
                                                <span className="type-badge">{order.type}</span>
                                            </td>
                                            <td>{order.details}</td>
                                            <td>{order.date}</td>
                                            <td className="fw-bold">{order.amount}</td>
                                            <td>
                                                {/* Make sure the CSS class matches the database status (e.g., 'pending', 'confirmed') */}
                                                <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                    {order.status}
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