import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminPanel = () => {
    // Make sure we bring in user and logout alongside token
    const { token, user, logout } = useAuth();
    const BASE_URL = 'http://localhost:3000/src/adminRoute';
    
    const [activeTab, setActiveTab] = useState('reservations');
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [computers, setComputers] = useState([]);

    useEffect(() => {
        if(token) fetchData();
    }, [token, activeTab]);

    const fetchData = async () => {
        try {
            if (activeTab === 'reservations') {
                const res = await fetch(`${BASE_URL}/bookings`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if(data.bookings) setBookings(data.bookings);
            } else if (activeTab === 'tickets') {
                const res = await fetch(`${BASE_URL}/tickets`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if(data.tickets) setTickets(data.tickets);
            } else if (activeTab === 'computers') {
                const res = await fetch(`${BASE_URL}/computers`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if(data.computers) setComputers(data.computers);
            }
        } catch (err) { console.error("Error fetching data:", err); }
    };

    const handleStartBooking = async (id) => {
        await fetch(`${BASE_URL}/bookings/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'active' }) 
        });
        fetchData();
    };

    const handleDeleteBooking = async (id) => {
        if(!window.confirm("Delete this reservation?")) return;
        await fetch(`${BASE_URL}/bookings/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
    };

    const handleToggleComputer = async (id, currentStatus) => {
        const newStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
        await fetch(`${BASE_URL}/computers/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ availability: newStatus })
        });
        fetchData();
    };

    return (
        <div className="dashboard-layout">
            {/* Standard Sidebar Added Here */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>BlackByte</h2>
                </div>
                
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item">Dashboard</a>
                        <a href="/booking" className="nav-item">Reservation</a>
                        
                        {/* Admin Link (Active in this view) */}
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

            {/* Main Content View */}
            <main className="dashboard-content" style={{ padding: '30px' }}>
                <h2>Admin Control Panel</h2>
                <div className="category-tabs" style={{ marginBottom: '20px' }}>
                    <button className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}>Reservations</button>
                    <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>Support Tickets</button>
                    <button className={`tab-btn ${activeTab === 'computers' ? 'active' : ''}`} onClick={() => setActiveTab('computers')}>PC Status</button>
                </div>

                {activeTab === 'reservations' && (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#fff' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #444' }}>
                                <th>ID</th><th>User</th><th>Station</th><th>Start Time</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid #333', height: '45px' }}>
                                    <td>{b.id}</td><td>{b.username}</td><td>{b.station_name}</td>
                                    <td>{new Date(b.start).toLocaleString()}</td><td>{b.status}</td>
                                    <td>
                                        {b.status === 'pending' && <button onClick={() => handleStartBooking(b.id)} style={{ marginRight: '10px', padding: '5px 10px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Start</button>}
                                        <button onClick={() => handleDeleteBooking(b.id)} style={{ padding: '5px 10px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'tickets' && (
                    <div style={{ color: '#fff' }}>
                        {tickets.map(t => (
                            <div key={t.id} style={{ background: '#2d2d2d', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                                <strong>User:</strong> {t.username} | <strong>Status:</strong> {t.status}
                                <p style={{ marginTop: '10px' }}>{t.issue}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'computers' && (
                    <div style={{ color: '#fff' }}>
                        {computers.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#2d2d2d', padding: '15px', marginBottom: '10px', borderRadius: '8px', alignItems: 'center' }}>
                                <span>{(c.name || c.pcname) || `PC-${c.id}`} ({c.type})</span>
                                <span style={{ color: c.availability === 'maintenance' ? '#f44336' : '#4CAF50' }}>{c.availability.toUpperCase()}</span>
                                <button onClick={() => handleToggleComputer(c.id, c.availability)} style={{ padding: '8px 15px', cursor: 'pointer' }}>
                                    Set to {c.availability === 'maintenance' ? 'Available' : 'Maintenance'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;