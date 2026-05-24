import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../pictures/logo.png';
import { useFeedback } from '../../context/feedbackContext';
import { LayoutDashboard, CalendarDays, Shield, User, Settings, LogOut, CheckSquare, Laptop, AlertCircle, Play, Trash2, CheckCircle } from 'lucide-react';

const AdminPanel = () => {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const { showFeedback } = useFeedback();
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const BASE_URL = `${API_URL}/api/admin`;
    
    const [activeTab, setActiveTab] = useState('reservations');
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [computers, setComputers] = useState([]);

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

            bodyData = { status: 'active', start: newStart.toISOString(), end: newEnd.toISOString() };
        }

        const res = await fetch(`${BASE_URL}/bookings/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(bodyData)
        });

        if(res.ok) { showFeedback('success', 'Reservation started successfully!'); fetchData(); } 
        else { showFeedback('error', 'Failed to start reservation.'); }
    };

    const handleDeleteBooking = async (id) => {
        if(!window.confirm("Delete this reservation?")) return;
        const res = await fetch(`${BASE_URL}/bookings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if(res.ok) { showFeedback('success', 'Reservation deleted successfully!'); fetchData(); } 
        else { showFeedback('error', 'Failed to delete reservation.'); }
    };

    const handleToggleComputer = async (id, currentStatus) => {
        const newStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
        const res = await fetch(`${BASE_URL}/computers/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ availability: newStatus })
        });

        if(res.ok) { showFeedback('success', `Computer status updated to ${newStatus.toUpperCase()}!`); fetchData(); } 
        else { showFeedback('error', 'Failed to update computer status.'); }
    };

    const handleResolveTicket = async (id) => {
        const res = await fetch(`${BASE_URL}/tickets/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'resolved' })
        });

        if(res.ok) { showFeedback('success', 'Support ticket marked as resolved!'); fetchData(); } 
        else { showFeedback('error', 'Failed to resolve support ticket.'); }
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
                        {user?.role === 'admin' && <a href="/admin" className="nav-item admin-item active"><Shield size={18} /> Admin Panel</a>}
                    </div>
                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item"><User size={18} /> Profile</a>
                        <a href="/settings" className="nav-item"><Settings size={18} /> Settings</a>
                        <button onClick={handleLogout} className="nav-item logout-btn"><LogOut size={18} /> Logout</button>
                    </div>
                </nav>
            </aside>

            <main className="dashboard-content" style={{ padding: '30px' }}>
                <h2>Admin Control Panel</h2>
                <div className="category-tabs" style={{ marginBottom: '20px' }}>
                    <button className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}><CheckSquare size={16} /> Reservations</button>
                    <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}><AlertCircle size={16} /> Support Tickets</button>
                    <button className={`tab-btn ${activeTab === 'computers' ? 'active' : ''}`} onClick={() => setActiveTab('computers')}><Laptop size={16} /> PC Status</button>
                </div>

                {activeTab === 'reservations' && (
                    <table className="activity-table">
                        <thead>
                            <tr><th>ID</th><th>User</th><th>Station</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b.id}>
                                    <td>{b.id}</td><td>{b.username}</td><td>{b.station_name}</td>
                                    <td>{new Date(b.start).toLocaleString()}</td><td>{new Date(b.end).toLocaleString()}</td>
                                    <td><span className={`status-badge ${b.status === 'active' ? 'active' : 'pending'}`}>{b.status}</span></td>
                                    <td>
                                        {b.status === 'pending' && <button onClick={() => handleStartBooking(b.id)} style={{ marginRight: '10px', padding: '6px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Play size={12} /> Start</button>}
                                        <button onClick={() => handleDeleteBooking(b.id)} style={{ padding: '6px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Trash2 size={12} /> Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'tickets' && (
                    <div className="tickets-list-wrapper">
                        {tickets.map(t => (
                            <div key={t.id} className="ticket-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0 }}>{t.subject} {t.station_id && <span style={{color: '#e94560'}}>(Station PC-{t.station_id})</span>}</h4>
                                    <span style={{ fontWeight: 'bold', color: t.status === 'open' ? '#dc3545' : '#28a745' }}>{t.status.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#6c757d', marginBottom: '10px' }}><strong>Reported by:</strong> {t.username} | <strong>Date:</strong> {new Date(t.created_at).toLocaleString()}</div>
                                <div className="ticket-issue">{t.issue}</div>
                                {t.status === 'open' && <button onClick={() => handleResolveTicket(t.id)} style={{ padding: '8px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Mark as Resolved</button>}
                            </div>
                        ))}
                        {tickets.length === 0 && <p style={{textAlign: 'center', color: '#6c757d', padding: '20px'}}>No support tickets submitted yet.</p>}
                    </div>
                )}

                {activeTab === 'computers' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {computers.map(c => (
                            <div key={c.id} style={{ background: '#fff', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px', fontSize: '1.1em' }}>{c.name || c.pcname || `PC-${c.id}`}</h4>
                                    <span style={{ fontSize: '0.85em', color: '#6c757d', textTransform: 'uppercase' }}>{c.type}</span>
                                </div>
                                <span style={{ fontWeight: 'bold', fontSize: '0.9em', padding: '4px 8px', borderRadius: '12px', backgroundColor: c.availability === 'maintenance' ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)', color: c.availability === 'maintenance' ? '#dc3545' : '#28a745' }}>{c.availability.toUpperCase()}</span>
                                <button onClick={() => handleToggleComputer(c.id, c.availability)} style={{ padding: '8px', cursor: 'pointer', background: c.availability === 'maintenance' ? '#28a745' : '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', marginTop: '5px' }}>Set {c.availability === 'maintenance' ? 'Available' : 'Maintenance'}</button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;