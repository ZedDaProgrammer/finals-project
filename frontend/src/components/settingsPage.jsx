import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
    const { user, token, logout } = useAuth();
    const BASE_URL = 'http://localhost:3000/src';

    // Account States
    const [accountData, setAccountData] = useState({ username: user?.username || '', email: user?.email || '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    
    // Ticket States
    const [ticket, setTicket] = useState({ station_id: '', subject: '', description: '' });
    
    // Dark Mode State (Loads saved preference)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    // Automatically apply Dark Mode to the whole website
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    }, [isDarkMode]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const res = await fetch(`${BASE_URL}/authRoute/update-profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(accountData)
        });
        if (res.ok) alert("Profile updated! Please refresh to see changes.");
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) return alert("Passwords do not match");
        const res = await fetch(`${BASE_URL}/authRoute/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
        });
        if (res.ok) {
            alert("Password changed successfully!");
            setPasswords({ current: '', new: '', confirm: '' });
        } else {
            const data = await res.json();
            alert(data.message || "Failed to change password");
        }
    };

    const handleAddCredits = async (amount) => {
        const res = await fetch(`${BASE_URL}/authRoute/add-credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount })
        });
        if (res.ok) {
            alert(`Successfully added ${amount} CR! Refreshing page to update balance...`);
            window.location.reload();
        }
    };

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        const res = await fetch(`${BASE_URL}/reservationRoute/ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(ticket)
        });
        if (res.ok) {
            alert("Support ticket submitted! An admin will review it shortly.");
            setTicket({ station_id: '', subject: '', description: '' });
        }
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand"><h2>BlackByte</h2></div>
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item">Dashboard</a>
                        <a href="/booking" className="nav-item">Reservation</a>
                        {user?.role === 'admin' && <a href="/admin" className="nav-item">Admin Panel</a>}
                    </div>
                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item">Profile</a>
                        <a href="/settings" className="nav-item active">Settings</a>
                        <button onClick={logout} className="nav-item logout-btn">Logout</button>
                    </div>
                </nav>
            </aside>

            <main className="dashboard-content">
                <div className="settings-container">
                    <header className="dashboard-header">
                        <div>
                            <h1>Settings & Preferences</h1>
                            <p>Manage your account, security, and app appearance.</p>
                        </div>
                    </header>
                    
                    <div className="settings-grid">
                        
                        {/* Appearance / Dark Mode */}
                        <section className="settings-card">
                            <h3>🌙 Appearance</h3>
                            <p style={{marginBottom: '20px'}}>Customize how BlackByte looks on your device.</p>
                            <div className="theme-switch-wrapper">
                                <div>
                                    <strong style={{ display: 'block', color: isDarkMode ? '#e0e0e0' : '#2b2d42' }}>Dark Mode</strong>
                                    <span style={{ fontSize: '12px', color: '#888' }}>Easier on the eyes in dark environments.</span>
                                </div>
                                <label className="theme-switch" htmlFor="checkbox">
                                    <input type="checkbox" id="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
                                    <div className="slider round"></div>
                                </label>
                            </div>
                        </section>

                        {/* Credit Top-up */}
                        <section className="settings-card">
                            <h3>💳 BlackByte Wallet</h3>
                            <p>Top up your credits to book PCs and VIP Rooms.</p>
                            <div className="wallet-balance">
                                {user?.credits || 0} <span style={{fontSize: '18px', color: '#888'}}>CR</span>
                            </div>
                            <div className="wallet-buttons">
                                <button onClick={() => handleAddCredits(100)} className="wallet-btn">+ 100 CR</button>
                                <button onClick={() => handleAddCredits(500)} className="wallet-btn">+ 500 CR</button>
                                <button onClick={() => handleAddCredits(1000)} className="wallet-btn">+ 1000 CR</button>
                            </div>
                        </section>

                        {/* Profile Update */}
                        <section className="settings-card">
                            <h3>👤 Profile Information</h3>
                            <form onSubmit={handleUpdateProfile}>
                                <div className="form-group">
                                    <label>Username</label>
                                    <input type="text" className="form-input" value={accountData.username} onChange={e => setAccountData({...accountData, username: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" className="form-input" value={accountData.email} onChange={e => setAccountData({...accountData, email: e.target.value})} required />
                                </div>
                                <button type="submit" className="settings-btn">Save Profile Changes</button>
                            </form>
                        </section>

                        {/* Password Change */}
                        <section className="settings-card">
                            <h3>🔒 Security</h3>
                            <form onSubmit={handleChangePassword}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input type="password" className="form-input" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" className="form-input" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} required />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input type="password" className="form-input" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} required />
                                </div>
                                <button type="submit" className="settings-btn" style={{ background: '#333' }}>Update Password</button>
                            </form>
                        </section>

                        {/* Support Ticket */}
                        <section className="settings-card" style={{ gridColumn: '1 / -1' }}>
                            <h3>🎧 Contact Support</h3>
                            <p style={{marginBottom: '20px'}}>Report broken equipment or request assistance from an admin.</p>
                            <form onSubmit={handleSubmitTicket} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>PC Station ID (Optional)</label>
                                        <input type="number" className="form-input" placeholder="e.g. 12" value={ticket.station_id} onChange={e => setTicket({...ticket, station_id: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Subject</label>
                                        <input type="text" className="form-input" placeholder="e.g. Broken Mouse" value={ticket.subject} onChange={e => setTicket({...ticket, subject: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Description</label>
                                    <textarea className="form-input" placeholder="Please describe the issue in detail..." value={ticket.description} onChange={e => setTicket({...ticket, description: e.target.value})} required style={{ height: '125px', resize: 'none' }} />
                                </div>
                                <button type="submit" className="settings-btn" style={{ gridColumn: '1 / -1', background: '#d84315' }}>Submit Ticket</button>
                            </form>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;