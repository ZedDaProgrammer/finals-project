import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import { useFeedback } from '../context/feedbackContext';
import { LayoutDashboard, CalendarDays, Shield, User, Settings, LogOut, CheckSquare, Laptop, AlertCircle, Play, Trash2, CheckCircle, Monitor, RefreshCw } from 'lucide-react';

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
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const [bookingsPage, setBookingsPage] = useState(1);
    const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
    const [ticketsPage, setTicketsPage] = useState(1);
    const [ticketsTotalPages, setTicketsTotalPages] = useState(1);

    useEffect(() => {
        document.title = "BlackByte | Admin Panel";
        if (user && user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, activeTab, bookingsPage, ticketsPage]);

    const fetchData = async () => {
        try {
            if (activeTab === 'reservations') {
                const res = await fetch(`${BASE_URL}/bookings?page=${bookingsPage}&limit=20`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.bookings) {
                    setBookings(data.bookings);
                    setBookingsTotalPages(data.pagination?.pages || 1);
                }
            } else if (activeTab === 'tickets') {
                const res = await fetch(`${BASE_URL}/tickets?page=${ticketsPage}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.tickets) {
                    setTickets(data.tickets);
                    setTicketsTotalPages(data.pagination?.pages || 1);
                }
            } else if (activeTab === 'computers') {
                const res = await fetch(`${BASE_URL}/computers`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.computers) setComputers(data.computers);
            } else if (activeTab === 'analytics') {
                setLoadingAnalytics(true);
                try {
                    const res = await fetch(`${API_URL}/api/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } });
                    const data = await res.json();
                    if (data) setAnalytics(data);
                } catch (err) {
                    console.error("Error fetching analytics:", err);
                } finally {
                    setLoadingAnalytics(false);
                }
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

        if (res.ok) { showFeedback('success', 'Reservation started successfully!'); fetchData(); }
        else { showFeedback('error', 'Failed to start reservation.'); }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm("Delete this reservation?")) return;
        const res = await fetch(`${BASE_URL}/bookings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { showFeedback('success', 'Reservation deleted successfully!'); fetchData(); }
        else { showFeedback('error', 'Failed to delete reservation.'); }
    };

    const handleToggleComputer = async (id, currentStatus) => {
        const newStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
        const res = await fetch(`${BASE_URL}/computers/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ availability: newStatus })
        });

        if (res.ok) { showFeedback('success', `Computer status updated to ${newStatus.toUpperCase()}!`); fetchData(); }
        else { showFeedback('error', 'Failed to update computer status.'); }
    };

    const handleResolveTicket = async (id) => {
        const res = await fetch(`${BASE_URL}/tickets/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'resolved' })
        });

        if (res.ok) { showFeedback('success', 'Support ticket marked as resolved!'); fetchData(); }
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

            <main className="dashboard-content">
                <div className="admin-panel-container">
                    <header className="dashboard-header">
                        <div>
                            <h1>Admin Control Panel</h1>
                            <p>Overview of system reservations, technical tickets, station status, and analytical insights.</p>
                        </div>
                    </header>

                    <div className="category-tabs">
                        <button className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}><CheckSquare size={16} /> Reservations</button>
                        <button className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}><AlertCircle size={16} /> Support Tickets</button>
                        <button className={`tab-btn ${activeTab === 'computers' ? 'active' : ''}`} onClick={() => setActiveTab('computers')}><Laptop size={16} /> PC Status</button>
                        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><LayoutDashboard size={16} /> Analytics</button>
                    </div>

                    <div className="admin-panel-content">
                        {activeTab === 'reservations' && (
                            <div className="admin-section-card">
                                <div className="admin-card-header">
                                    <h3>System Booking Reservations</h3>
                                </div>
                                <div className="table-container">
                                    <table className="activity-table">
                                        <thead>
                                            <tr><th>ID</th><th>User</th><th>Station</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {bookings.map(b => {
                                                const isActive = b.status === 'active';
                                                const isPending = b.status === 'pending';
                                                const isExpired = new Date(b.end) < new Date();
                                                return (
                                                    <tr key={b.id}>
                                                        <td className="fw-bold">#RES-{b.id}</td>
                                                        <td>{b.username}</td>
                                                        <td>{b.station_name || `PC Station ${b.station_id}`}</td>
                                                        <td>{new Date(b.start).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td>{new Date(b.end).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                        <td>
                                                            <span className={`status-badge ${isActive ? 'active' : (isPending ? (isExpired ? 'completed' : 'pending') : 'completed')}`}>
                                                                {isPending && isExpired ? 'expired' : b.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="table-action-row">
                                                                {isPending && !isExpired && (
                                                                    <button onClick={() => handleStartBooking(b.id)} className="table-action-btn start">
                                                                        <Play size={12} /> Start
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleDeleteBooking(b.id)} className="table-action-btn delete">
                                                                    <Trash2 size={12} /> Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="pagination-controls">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => setBookingsPage(prev => Math.max(prev - 1, 1))}
                                        disabled={bookingsPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span className="pagination-info">Page {bookingsPage} of {bookingsTotalPages}</span>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => setBookingsPage(prev => Math.min(prev + 1, bookingsTotalPages))}
                                        disabled={bookingsPage === bookingsTotalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tickets' && (
                            <div className="admin-section-card">
                                <div className="admin-card-header">
                                    <h3>User Technical Support Tickets</h3>
                                </div>
                                <div className="tickets-grid">
                                    {tickets.map(t => {
                                        const isOpen = t.status === 'open';
                                        return (
                                            <div key={t.id} className={`ticket-card ${isOpen ? 'open-ticket' : 'resolved-ticket'}`}>
                                                <div className="ticket-header">
                                                    <div className="ticket-title-block">
                                                        <h4>{t.subject}</h4>
                                                        {t.station_id && <span className="ticket-station-badge">PC Station {t.station_id}</span>}
                                                    </div>
                                                    <span className={`ticket-status-badge ${isOpen ? 'open' : 'resolved'}`}>
                                                        {t.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ticket-meta">
                                                    <span><strong>Reported by:</strong> {t.username}</span>
                                                    <span className="meta-separator">•</span>
                                                    <span>{new Date(t.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="ticket-issue">
                                                    <p>{t.issue}</p>
                                                </div>
                                                {isOpen && (
                                                    <button onClick={() => handleResolveTicket(t.id)} className="ticket-resolve-btn">
                                                        <CheckCircle size={14} /> Mark as Resolved
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {tickets.length === 0 && <p className="no-data-text">No support tickets submitted yet.</p>}
                                </div>
                                {tickets.length > 0 && (
                                    <div className="pagination-controls">
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setTicketsPage(prev => Math.max(prev - 1, 1))}
                                            disabled={ticketsPage === 1}
                                        >
                                            Previous
                                        </button>
                                        <span className="pagination-info">Page {ticketsPage} of {ticketsTotalPages}</span>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setTicketsPage(prev => Math.min(prev + 1, ticketsTotalPages))}
                                            disabled={ticketsPage === ticketsTotalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'computers' && (
                            <div className="admin-section-card">
                                <div className="admin-card-header">
                                    <h3>Workstation Terminals Status</h3>
                                </div>
                                <div className="computer-status-grid">
                                    {computers.map(c => {
                                        const isMaintenance = c.availability === 'maintenance';
                                        return (
                                            <div key={c.id} className={`computer-status-card ${isMaintenance ? 'maintenance-card' : 'available-card'}`}>
                                                <div className="computer-card-header">
                                                    <div className={`computer-card-icon ${isMaintenance ? 'maintenance' : 'available'}`}>
                                                        <Laptop size={24} />
                                                    </div>
                                                    <div className="computer-card-title">
                                                        <h4>{c.name || c.pcname || `PC-${c.id}`}</h4>
                                                        <span className="computer-type-badge">{c.type.toUpperCase()} PC</span>
                                                    </div>
                                                </div>
                                                <div className="computer-card-status">
                                                    <span className={`status-indicator-glow ${isMaintenance ? 'maintenance' : 'available'}`}>
                                                        {c.availability.toUpperCase()}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => handleToggleComputer(c.id, c.availability)} 
                                                    className={`computer-action-btn ${isMaintenance ? 'set-available' : 'set-maintenance'}`}
                                                >
                                                    Set {isMaintenance ? 'Available' : 'Maintenance'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="analytics-tab-wrapper">
                                {loadingAnalytics ? (
                                    <p className="no-data-text">Loading analytics data...</p>
                                ) : !analytics ? (
                                    <p className="no-data-text">No analytics data available.</p>
                                ) : (
                                    <div>
                                        <div className="analytics-grid">
                                            <div className="analytics-card">
                                                <div className="chart-header">
                                                    <h3>Peak Reservation Hours</h3>
                                                    <span className="chart-desc">Hourly distribution of bookings</span>
                                                </div>
                                                <div className="svg-chart-container">
                                                    {(() => {
                                                        const hoursData = Array.from({ length: 24 }, (_, i) => {
                                                            const found = analytics.hours?.find(h => h.hour === i);
                                                            return { hour: i, count: found ? found.count : 0 };
                                                        });
                                                        const maxCount = Math.max(...hoursData.map(d => d.count), 1);
                                                        const svgW = 560;
                                                        const svgH = 200;
                                                        const chartY = 170;
                                                        const chartXStart = 35;
                                                        const barW = 16;
                                                        const barGap = 5;

                                                        return (
                                                            <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
                                                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                                                    const lineY = chartY - ratio * 140;
                                                                    const labelVal = Math.round(ratio * maxCount);
                                                                    return (
                                                                        <g key={index}>
                                                                            <line className="chart-axis-line" x1={chartXStart} y1={lineY} x2={svgW - 10} y2={lineY} stroke="#edf2f7" strokeDasharray="3 3" />
                                                                            <text className="chart-axis-text" x={chartXStart - 8} y={lineY + 4} textAnchor="end">{labelVal}</text>
                                                                        </g>
                                                                    );
                                                                })}
                                                                {hoursData.map((d, index) => {
                                                                    const barH = (d.count / maxCount) * 140;
                                                                    const barX = chartXStart + index * (barW + barGap);
                                                                    const barY = chartY - barH;
                                                                    return (
                                                                        <g key={index}>
                                                                            <rect 
                                                                                className="chart-bar" 
                                                                                x={barX} 
                                                                                y={barY} 
                                                                                width={barW} 
                                                                                height={Math.max(barH, 2)} 
                                                                                rx="3" 
                                                                                style={{ fill: '#e94560' }}
                                                                            >
                                                                                <title>{`${d.hour}:00 - ${d.count} reservation(s)`}</title>
                                                                            </rect>
                                                                            {index % 2 === 0 && (
                                                                                <text className="chart-axis-text" x={barX + barW / 2} y={chartY + 16} textAnchor="middle">
                                                                                    {String(d.hour).padStart(2, '0')}
                                                                                </text>
                                                                            )}
                                                                        </g>
                                                                    );
                                                                })}
                                                                <line className="chart-axis-line" x1={chartXStart} y1={chartY} x2={svgW - 10} y2={chartY} stroke="#6c757d" strokeWidth="1" />
                                                            </svg>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="analytics-card flex-column-card">
                                                <div className="chart-header">
                                                    <h3>PC Status Availability</h3>
                                                </div>
                                                <div className="gauge-wrapper">
                                                    {(() => {
                                                        const totalComputers = analytics.computers?.reduce((sum, c) => sum + c.count, 0) || 0;
                                                        const availableCount = analytics.computers?.find(c => c.availability === 'available')?.count || 0;
                                                        const availabilityRate = totalComputers > 0 ? Math.round((availableCount / totalComputers) * 100) : 0;
                                                        const strokeDasharray = 440;
                                                        const strokeDashoffset = strokeDasharray - (availabilityRate / 100) * strokeDasharray;

                                                        return (
                                                            <>
                                                                <svg className="gauge-svg" width="160" height="160" viewBox="0 0 160 160">
                                                                    <circle className="gauge-bg" cx="80" cy="80" r="70" />
                                                                    <circle 
                                                                        className="gauge-val" 
                                                                        cx="80" 
                                                                        cy="80" 
                                                                        r="70" 
                                                                        strokeDasharray={strokeDasharray} 
                                                                        strokeDashoffset={strokeDashoffset} 
                                                                    />
                                                                </svg>
                                                                <div className="gauge-info">
                                                                    <div className="gauge-number">{availabilityRate}%</div>
                                                                    <div className="gauge-label">Operational</div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="gauge-stats-row">
                                                    <div className="gauge-stat-box">
                                                        <span className="val-text available">
                                                            {analytics.computers?.find(c => c.availability === 'available')?.count || 0}
                                                        </span>
                                                        <span className="lbl-text">Available</span>
                                                    </div>
                                                    <div className="gauge-stat-box">
                                                        <span className="val-text maintenance">
                                                            {analytics.computers?.find(c => c.availability === 'maintenance')?.count || 0}
                                                        </span>
                                                        <span className="lbl-text">Maintenance</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="analytics-grid secondary-grid">
                                            <div className="analytics-card">
                                                <div className="chart-header">
                                                    <h3>Zone Popularity</h3>
                                                    <span className="chart-desc">Bookings count per zone type</span>
                                                </div>
                                                <div className="stat-progress-list">
                                                    {(() => {
                                                        const totalZoneReservations = analytics.zones?.reduce((sum, z) => sum + z.count, 0) || 1;
                                                        const zoneLabels = {
                                                            standard: 'Standard Lounge',
                                                            vip: 'VIP Lounge / Room / Suite'
                                                        };

                                                        return analytics.zones?.map((z, idx) => {
                                                            const pct = Math.round((z.count / totalZoneReservations) * 100);
                                                            const displayName = zoneLabels[z.type.toLowerCase().trim()] || z.type;
                                                            return (
                                                                <div className="stat-progress-item" key={idx}>
                                                                    <div className="stat-progress-label">
                                                                        <span>{displayName}</span>
                                                                        <span className="stat-progress-count">{z.count} booking(s) ({pct}%)</span>
                                                                    </div>
                                                                    <div className="stat-progress-track">
                                                                        <div className="stat-progress-bar" style={{ width: `${pct}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                    {(!analytics.zones || analytics.zones.length === 0) && (
                                                        <p className="no-data-subtext">No zone bookings data available.</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="analytics-card">
                                                <div className="chart-header">
                                                    <h3>Support Tickets Status</h3>
                                                    <span className="chart-desc">Resolved vs Open tickets</span>
                                                </div>
                                                <div className="stat-progress-list">
                                                    {(() => {
                                                        const totalTickets = analytics.tickets?.reduce((sum, t) => sum + t.count, 0) || 0;
                                                        const resolvedCount = analytics.tickets?.find(t => t.status === 'resolved')?.count || 0;
                                                        const openCount = analytics.tickets?.find(t => t.status === 'open')?.count || 0;
                                                        const resolvedPct = totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0;
                                                        const openPct = totalTickets > 0 ? Math.round((openCount / totalTickets) * 100) : 0;

                                                        return (
                                                            <>
                                                                <div className="stat-progress-item">
                                                                    <div className="stat-progress-label">
                                                                        <span>Resolved Tickets</span>
                                                                        <span className="stat-progress-count resolved">{resolvedCount} ({resolvedPct}%)</span>
                                                                    </div>
                                                                    <div className="stat-progress-track resolved">
                                                                        <div className="stat-progress-bar resolved" style={{ width: `${resolvedPct}%` }}></div>
                                                                    </div>
                                                                </div>
                                                                <div className="stat-progress-item mt-15">
                                                                    <div className="stat-progress-label">
                                                                        <span>Open Tickets</span>
                                                                        <span className="stat-progress-count open">{openCount} ({openPct}%)</span>
                                                                    </div>
                                                                    <div className="stat-progress-track open">
                                                                        <div className="stat-progress-bar open" style={{ width: `${openPct}%` }}></div>
                                                                    </div>
                                                                </div>
                                                                <div className="tickets-total-footer">
                                                                    Total Tickets Handled: <strong>{totalTickets}</strong>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;