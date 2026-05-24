import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, X } from 'lucide-react';
import logoImg from '../../pictures/logo.png';

const ProfilePage = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const BASE_URL = `${API_URL}/api/reservation`;

    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [creditSlider, setCreditSlider] = useState(20);
    const [isAddingCredits, setIsAddingCredits] = useState(false);

    const points = user?.points || 0;
    const credits = user?.credits || 0;

    const evaluatePoints = (points) => {
        if(points >= 350) return 'Radiant';
        if(points >= 175) return 'Platinum';
        if(points >= 75) return 'Gold';
        if(points >= 25) return 'Silver';
        return 'Bronze';
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${BASE_URL}/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data.history);
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error("Failed to fetch history:", err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchHistory();
    }, [token]);

    const handleAddCredits = async () => {
        setIsAddingCredits(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/add-credits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: creditSlider })
            });

            if (response.ok) {
                setShowWalletModal(false);
                setCreditSlider(20);
                // Trigger a refresh by updating user context (you may need to add this to AuthContext)
                window.location.reload();
            } else {
                alert('Failed to add credits');
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Credit addition error:", error);
            }
            alert('Error adding credits');
        } finally {
            setIsAddingCredits(false);
        }
    };

    const rank = evaluatePoints(points);
    const visibleHistory = history.filter(res => res.status !== 'cancelled');

    const handleLogout = () => {
        localStorage.removeItem('token'); 
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
                        <a href="/dashboard" className="nav-item">Dashboard</a>
                        <a href="/booking" className="nav-item">Reservation</a>
                        {user?.role === 'admin' && (
                            <a href="/admin" className="nav-item admin-item active">Admin Panel</a>
                        )}
                    </div>

                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item active">Profile</a>
                        <a href="/settings" className="nav-item">Settings</a>
                        <button onClick={handleLogout} className="nav-item logout-btn">Logout</button>
                    </div>
                </nav>
            </aside>

            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1>My Profile</h1>
                    <p>Manage your account and view your past activity.</p>
                </header>

                <div className="profile-container">
                    {/* User Info Card */}
                    <div className="profile-card">
                        <div className="profile-avatar">
                            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="profile-details">
                            <h2>{user?.username}</h2>
                            <p>{user?.email}</p>
                            <div className="rank-badge">
                                <strong>Rank:</strong> <span className={`rank-${rank.toLowerCase()}`}>{rank}</span>
                            </div>
                            
                            {/* FEATURE: Wallet Card with Top-Up Button */}
                            <div className="wallet-card">
                                <div className="wallet-header">
                                    <Wallet size={20} style={{ marginRight: '8px' }} />
                                    <span className="wallet-label">BlackByte Wallet</span>
                                </div>
                                <div className="wallet-content">
                                    <div className="credits-display">
                                        <span className="credits-amount">{credits}</span>
                                        <span className="credits-label">Credits</span>
                                    </div>
                                    <button 
                                        className="wallet-topup-btn"
                                        onClick={() => setShowWalletModal(true)}
                                    >
                                        <Plus size={18} />
                                        Top Up
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Top-Up Modal */}
                    {showWalletModal && (
                        <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Top Up Credits</h3>
                                    <button 
                                        className="modal-close"
                                        onClick={() => setShowWalletModal(false)}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <div className="slider-container">
                                        <div className="slider-info">
                                            <span className="slider-label">Select Amount</span>
                                            <span className="slider-value">{creditSlider} CR</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="20" 
                                            max="1000" 
                                            step="20" 
                                            value={creditSlider}
                                            onChange={(e) => setCreditSlider(parseInt(e.target.value))}
                                            className="slider"
                                        />
                                        <div className="slider-marks">
                                            <span>20</span>
                                            <span>500</span>
                                            <span>1000</span>
                                        </div>
                                    </div>

                                    <div className="credit-breakdown">
                                        <div className="breakdown-item">
                                            <span>Amount:</span>
                                            <span className="amount">{creditSlider} CR</span>
                                        </div>
                                        <div className="breakdown-item">
                                            <span>Current Balance:</span>
                                            <span className="balance">{credits} CR</span>
                                        </div>
                                        <div className="breakdown-item total">
                                            <span>New Balance:</span>
                                            <span className="new-balance">{credits + creditSlider} CR</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button 
                                        className="btn-cancel"
                                        onClick={() => setShowWalletModal(false)}
                                        disabled={isAddingCredits}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn-confirm"
                                        onClick={handleAddCredits}
                                        disabled={isAddingCredits}
                                    >
                                        {isAddingCredits ? 'Processing...' : `Add ${creditSlider} CR`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Table */}
                    <div className="history-section">
                        <h2>Reservation History</h2>
                        <div className="table-container">
                            {isLoading ? (
                                <p style={{textAlign: 'center', padding: '20px'}}>Loading history...</p>
                            ) : visibleHistory.length === 0 ? (
                                <p style={{textAlign: 'center', padding: '20px'}}>You have no reservation history.</p>
                            ) : (
                                <table className="activity-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>PC Type</th>
                                            <th>Date & Time</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleHistory.map((res) => {
                                            const start = new Date(res.start);
                                            const end = new Date(res.end);
                                            const now = new Date();
                                            const durationHrs = Math.round(Math.abs(end - start) / 36e5);

                                            let displayStatus = 'UPCOMING';
                                            let badgeClass = 'pending';

                                            if (now > end) {
                                                displayStatus = 'COMPLETED';
                                                badgeClass = 'completed';
                                            } else if (now >= start && now <= end) {
                                                displayStatus = 'ACTIVE';
                                                badgeClass = 'active';
                                            }

                                            return (
                                                <tr key={res.reservation_id}>
                                                    <td className="fw-bold">#RES-{res.reservation_id}</td>
                                                    <td>{(res.computer_type || 'Unknown').toUpperCase()} PC</td>
                                                    <td>{start.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td>{durationHrs} hour(s)</td>
                                                    <td>
                                                        <span className={`status-badge ${badgeClass}`}>
                                                            {displayStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
