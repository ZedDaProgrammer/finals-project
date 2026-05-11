import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; 

const Dashboard = () => {
    const { user, logout } = useAuth();
    
    // Top widgets mock data
    const [dashboardData] = useState({
        availablePCs: 18,
        availableVipPCs: 4,
        userTotalBooked: 12,
        orderHistory: 5
    });

    // New mock data for the Order History Panel
    const [recentOrders] = useState([
        { id: '#RES-042', type: 'PC', details: 'VIP PC - 3 Hours', date: '2026-05-11', status: 'Active', amount: '₱150' },
        { id: '#ORD-001', type: 'Food', details: 'Pancit Canton & Coke', date: '2026-05-11', status: 'Completed', amount: '₱120' },
        { id: '#ORD-002', type: 'Food', details: 'Sisig Rice Bowl', date: '2026-05-09', status: 'Completed', amount: '₱95' },
        { id: '#RES-038', type: 'PC', details: 'Standard PC - 5 Hours', date: '2026-05-08', status: 'Completed', amount: '₱100' },
    ]);

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
                            <p className="widget-value">{dashboardData.availablePCs}</p>
                            <span className="widget-desc">Standard Units</span>
                        </div>
                    </div>
                    <div className="widget-card">
                        <div className="widget-icon vip-pc">⭐</div>
                        <div className="widget-info">
                            <h3>Available VIP PC</h3>
                            <p className="widget-value">{dashboardData.availableVipPCs}</p>
                            <span className="widget-desc">High-End Units</span>
                        </div>
                    </div>
                    <div className="widget-card">
                        <div className="widget-icon booked">📅</div>
                        <div className="widget-info">
                            <h3>Total Booked</h3>
                            <p className="widget-value">{dashboardData.userTotalBooked}</p>
                            <span className="widget-desc">Your past sessions</span>
                        </div>
                    </div>
                    <div className="widget-card">
                        <div className="widget-icon orders">🍔</div>
                        <div className="widget-info">
                            <h3>Order History</h3>
                            <p className="widget-value">{dashboardData.orderHistory}</p>
                            <span className="widget-desc">Food & Beverages</span>
                        </div>
                    </div>
                </div>

                {/* NEW: Order History Panel */}
                <section className="recent-activity-panel">
                    <div className="panel-header">
                        <h2>Recent History</h2>
                        <button className="view-all-btn">View All</button>
                    </div>
                    
                    <div className="table-container">
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
                                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Dashboard;