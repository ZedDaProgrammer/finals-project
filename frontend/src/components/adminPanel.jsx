import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../pictures/logo.png';

const AdminPanel = () => {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    
    // UPDATED BASE URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const BASE_URL = `${API_URL}/api/admin`;
    
    const [activeTab, setActiveTab] = useState('reservations');
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [computers, setComputers] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
   useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

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
        const booking = bookings.find(b => b.id === id);
        let bodyData = { status: 'active' };

        if (booking) {
            const originalStart = new Date(booking.start);
            const originalEnd = new Date(booking.end);
            const durationMs = originalEnd.getTime() - originalStart.getTime();

            const newStart = new Date();
            const newEnd = new Date(newStart.getTime() + durationMs);

            bodyData = {
                status: 'active',
                start: newStart.toISOString(),
                end: newEnd.toISOString()
            };
        }

        await fetch(`${BASE_URL}/bookings/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(bodyData)
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

    const handleResolveTicket = async (id) => {
        await fetch(`${BASE_URL}/tickets/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'resolved' })
        });
        fetchData();
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
                            {bookings.map(b => (
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
                            <div key={t.id} style={{ background: '#fff', border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0 }}>{t.subject} {t.station_id && <span style={{color: '#d84315'}}>(Station PC-{t.station_id})</span>}</h4>
                                    <span style={{ fontWeight: 'bold', color: t.status === 'open' ? '#f44336' : '#4CAF50' }}>
                                        {t.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#555', marginBottom: '10px' }}>
                                    <strong>Reported by:</strong> {t.username} | <strong>Date:</strong> {new Date(t.created_at).toLocaleString()}
                                </div>
                                <div style={{ background: '#fff', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                                    {t.issue}
                                </div>
                                
                                {t.status === 'open' && (
                                    <button 
                                        onClick={() => handleResolveTicket(t.id)} 
                                        style={{ padding: '8px 15px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Mark as Resolved
                                    </button>
                                )}
                            </div>
                        ))}
                        {tickets.length === 0 && <p>No support tickets submitted yet.</p>}
                    </div>
                )}

                {activeTab === 'computers' && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                        gap: '15px', 
                        color: '#333' 
                    }}>
                        {computers.map(c => (
                            <div key={c.id} style={{ 
                                background: '#fff', 
                                border: '1px solid #ddd', 
                                padding: '15px', 
                                borderRadius: '8px', 
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '10px'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px', fontSize: '1.1em' }}>
                                        {(c.name || c.pcname) || `PC-${c.id}`}
                                    </h4>
                                    <span style={{ fontSize: '0.85em', color: '#666', textTransform: 'uppercase' }}>
                                        {c.type}
                                    </span>
                                </div>
                                
                                <span style={{ 
                                    fontWeight: 'bold', 
                                    fontSize: '0.9em',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: c.availability === 'maintenance' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                                    color: c.availability === 'maintenance' ? '#f44336' : '#4CAF50' 
                                }}>
                                    {c.availability.toUpperCase()}
                                </span>

                                <button 
                                    onClick={() => handleToggleComputer(c.id, c.availability)} 
                                    style={{ 
                                        padding: '8px', 
                                        cursor: 'pointer',
                                        background: c.availability === 'maintenance' ? '#4CAF50' : '#f44336',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        marginTop: '5px'
                                    }}
                                >
                                    Set {c.availability === 'maintenance' ? 'Available' : 'Maintenance'}
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