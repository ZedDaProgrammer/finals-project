import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminPanel = () => {
    const { token, user, logout } = useAuth();
    const BASE_URL = 'http://localhost:3000/src/adminRoute';
    
    const [activeTab, setActiveTab] = useState('reservations');
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [computers, setComputers] = useState([]);
    
    // Live timer for Auto-Delete UI
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>BlackByte</h2>
                </div>
                
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item">Dashboard</a>
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

            <main className="dashboard-content" style={{ padding: '30px' }}>
                <h2>Admin Control Panel</h2>
                <div className="category-tabs" style={{ marginBottom: '20px' }}>
                    <button className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}>Reservations</button>
                    <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>Support Tickets</button>
                    <button className={`tab-btn ${activeTab === 'computers' ? 'active' : ''}`} onClick={() => setActiveTab('computers')}>PC Status</button>
                </div>

                {activeTab === 'reservations' && (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#333' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ccc' }}>
                                <th>ID</th><th>User</th><th>Station</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings
                                // Hides row from Admin UI when its end time naturally expires
                                .filter(b => new Date(b.end) > currentTime)
                                .map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid #eee', height: '45px' }}>
                                    <td>{b.id}</td><td>{b.username}</td><td>{b.station_name}</td>
                                    <td>{new Date(b.start).toLocaleString()}</td>
                                    <td>{new Date(b.end).toLocaleString()}</td>
                                    <td>{b.status}</td>
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
                    <div style={{ color: '#333' }}>
                        {tickets.map(t => (
                            <div key={t.id} style={{ background: '#fff', border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                                <strong>User:</strong> {t.username} | <strong>Status:</strong> {t.status}
                                <p style={{ marginTop: '10px' }}>{t.issue}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'computers' && (
                    <div style={{ color: '#333' }}>
                        {computers.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px', alignItems: 'center' }}>
                                <span>{(c.name || c.pcname) || `PC-${c.id}`} ({c.type})</span>
                                <span style={{ fontWeight: 'bold', color: c.availability === 'maintenance' ? '#f44336' : '#4CAF50' }}>{c.availability.toUpperCase()}</span>
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