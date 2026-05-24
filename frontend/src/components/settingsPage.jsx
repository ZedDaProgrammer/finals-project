import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/feedbackContext';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../pictures/logo.png';
import { LayoutDashboard, CalendarDays, Shield, User, Settings, LogOut } from 'lucide-react';

const SettingsPage = () => {
    const { user, token, logout } = useAuth();
    const { showFeedback } = useFeedback();
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const BASE_URL = `${API_URL}/api`;

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [ticket, setTicket] = useState({ station_id: '', subject: '', description: '' });
    
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    }, [isDarkMode]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            showFeedback('error', "Passwords do not match");
            return;
        }

        const res = await fetch(`${BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
        });

        if (res.ok) {
            showFeedback('success', "Password changed successfully!");
            setPasswords({ current: '', new: '', confirm: '' });
        } else {
            const data = await res.json();
            showFeedback('error', data.message || "Failed to change password");
        }
    };

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        const res = await fetch(`${BASE_URL}/reservation/ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(ticket)
        });

        if (res.ok) {
            showFeedback('success', "Support ticket submitted! An admin will review it shortly.");
            setTicket({ station_id: '', subject: '', description: '' });
        } else {
            showFeedback('error', "Failed to submit ticket. Try again later.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token'); 
        logout();
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
                        <a href="/dashboard" className="nav-item"><LayoutDashboard size={18} /> Dashboard</a>
                        <a href="/booking" className="nav-item"><CalendarDays size={18} /> Reservation</a>
                        {user?.role === 'admin' && <a href="/admin" className="nav-item admin-item"><Shield size={18} /> Admin Panel</a>}
                    </div>
                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item"><User size={18} /> Profile</a>
                        <a href="/settings" className="nav-item active"><Settings size={18} /> Settings</a>
                        <button onClick={handleLogout} className="nav-item logout-btn"><LogOut size={18} /> Logout</button>
                    </div>
                </nav>
            </aside>

            <main className="dashboard-content">
                <div className="settings-container" style={{ maxWidth: '850px', margin: '0 auto', padding: '20px 0' }}>
                    <header className="dashboard-header" style={{ marginBottom: '40px' }}>
                        <div>
                            <h1>Settings & Preferences</h1>
                            <p>Manage your system visibility, security configurations, and support details.</p>
                        </div>
                    </header>
                    
                    <div className="settings-grid" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        
                        {/* Appearance / Dark Mode */}
                        <section className="settings-card" style={{ margin: 0 }}>
                            <h3>🖥️ Appearance</h3>
                            <p style={{ marginBottom: '20px', color: '#6c757d' }}>Customize the workspace presentation interface on your desktop workstation.</p>
                            <div className="theme-switch-wrapper">
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px' }}>Dark Mode Theme</strong>
                                    <span style={{ fontSize: '12px', color: '#888' }}>Reduces eye fatigue during high-intensity sessions.</span>
                                </div>
                                <label className="theme-switch" htmlFor="checkbox">
                                    <input type="checkbox" id="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
                                    <div className="toggle-slider round"></div>
                                </label>
                            </div>
                        </section>

                        {/* Password Change */}
                        <section className="settings-card" style={{ margin: 0 }}>
                            <h3>🔒 Security & Credentials</h3>
                            <p style={{ marginBottom: '25px', color: '#6c757d' }}>Update your authentication passphrase regularly to protect user account data.</p>
                            <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                    <label>Current Account Password</label>
                                    <input type="password" className="form-input" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>New Passphrase</label>
                                    <input type="password" className="form-input" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Confirm Passphrase Verification</label>
                                    <input type="password" className="form-input" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} required />
                                </div>
                                <button type="submit" className="settings-btn" style={{ gridColumn: '1 / -1', background: '#222', marginTop: '10px' }}>Update Secure Password</button>
                            </form>
                        </section>

                        {/* Support Ticket */}
                        <section className="settings-card" style={{ margin: 0 }}>
                            <h3>📞 Request Admin Technical Support</h3>
                            <p style={{ marginBottom: '25px', color: '#6c757d' }}>Report any active hardware faults, component degradation, or peripheral layout issues.</p>
                            <form onSubmit={handleSubmitTicket} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>PC Station ID</label>
                                        <input type="number" className="form-input" placeholder="e.g. Node-12" value={ticket.station_id} onChange={e => setTicket({...ticket, station_id: e.target.value})} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Fault Classification (Subject)</label>
                                        <input type="text" className="form-input" placeholder="e.g. Peripheral Disconnected" value={ticket.subject} onChange={e => setTicket({...ticket, subject: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Detailed System Diagnostics Description</label>
                                    <textarea className="form-input" placeholder="Specify failure context, error codes, or hardware symptoms..." value={ticket.description} onChange={e => setTicket({...ticket, description: e.target.value})} required style={{ height: '100%', minHeight: '135px', resize: 'none' }} />
                                </div>
                                <button type="submit" className="settings-btn" style={{ gridColumn: '1 / -1', background: '#e94560', marginTop: '10px' }}>Dispatch Support Ticket</button>
                            </form>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;