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
    const [userTickets, setUserTickets] = useState([]);

    useEffect(() => {
        if (token) fetchUserTickets();
    }, [token]);

    const fetchUserTickets = async () => {
        try {
            const res = await fetch(`${BASE_URL}/reservationRoute/my-tickets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.tickets) setUserTickets(data.tickets);
        } catch (err) { console.error("Error fetching tickets:", err); }
    };

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
        if (res.ok) alert(`Successfully added ${amount} CR!`);
    };

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        const res = await fetch(`${BASE_URL}/reservationRoute/ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(ticket)
        });
        if (res.ok) {
            alert("Support ticket submitted!");
            setTicket({ subject: '', description: '', priority: 'normal' });
            fetchUserTickets();
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

            <main className="dashboard-content" style={{ padding: '40px', overflowY: 'auto' }}>
                <h1>Account Settings</h1>
                
                <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
                    
                    {/* Profile Update */}
                    <section className="settings-card" style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
                        <h3>Update Profile</h3>
                        <form onSubmit={handleUpdateProfile}>
                            <label>Username</label>
                            <input type="text" value={accountData.username} onChange={e => setAccountData({...accountData, username: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '15px', padding: '10px' }} />
                            <label>Email</label>
                            <input type="email" value={accountData.email} onChange={e => setAccountData({...accountData, email: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '15px', padding: '10px' }} />
                            <button type="submit" className="confirm-btn">Save Changes</button>
                        </form>
                    </section>

                    {/* Password Change */}
                    <section className="settings-card" style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
                        <h3>Security</h3>
                        <form onSubmit={handleChangePassword}>
                            <input type="password" placeholder="Current Password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }} />
                            <input type="password" placeholder="New Password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }} />
                            <input type="password" placeholder="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '15px', padding: '10px' }} />
                            <button type="submit" className="confirm-btn" style={{ background: '#333' }}>Update Password</button>
                        </form>
                    </section>

                    {/* Credit Top-up */}
                    <section className="settings-card" style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
                        <h3>BlackByte Wallet</h3>
                        <p>Current Balance: <strong>{user?.credits || 0} CR</strong></p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={() => handleAddCredits(100)} className="tab-btn">+100 CR</button>
                            <button onClick={() => handleAddCredits(500)} className="tab-btn">+500 CR</button>
                            <button onClick={() => handleAddCredits(1000)} className="tab-btn">+1000 CR</button>
                        </div>
                    </section>

                    {/* Support Ticket */}
                    {/* Support Ticket */}
                    <section className="settings-card" style={{ background: '#fff', padding: '20px', borderRadius: '10px' }}>
                        <h3>Support Ticket</h3>
                        <form onSubmit={handleSubmitTicket}>
                            <input type="number" placeholder="PC Station ID (Optional)" value={ticket.station_id} onChange={e => setTicket({...ticket, station_id: e.target.value})} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }} />
                            <input type="text" placeholder="Subject (e.g. Broken Mouse, Refund Request)" value={ticket.subject} onChange={e => setTicket({...ticket, subject: e.target.value})} required style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px' }} />
                            <textarea placeholder="Describe the issue in detail..." value={ticket.description} onChange={e => setTicket({...ticket, description: e.target.value})} required style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '10px', height: '80px' }} />
                            <button type="submit" className="confirm-btn" style={{ background: '#d84315' }}>Submit Ticket</button>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;