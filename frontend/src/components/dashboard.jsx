import React, { useState } from 'react';
// Adjust the import path based on exactly how you exported it from AuthContext.jsx
import { useAuth } from '../../context/AuthContext'; 

const Dashboard = () => {
    const { user, logout } = useAuth();
    
    // Mock state for the dashboard widgets. 
    // You will eventually replace these values with a fetch request to your Node.js/PostgreSQL backend.
    const [dashboardData, setDashboardData] = useState({
        availablePCs: 18,
        availableVipPCs: 4,
        userTotalBooked: 12,
        orderHistory: 5
    });

    return (
        <div className="dashboard-layout">
         
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

           
            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1>Welcome back, {user?.name || 'User'}!</h1>
                    <p>Here is the current status of the LAN center and your session history.</p>
                </header>

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
            </main>
        </div>
    );
};

export default Dashboard;