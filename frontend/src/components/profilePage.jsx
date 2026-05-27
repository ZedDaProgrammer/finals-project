import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, X, LayoutDashboard, CalendarDays, Shield, User, Settings, LogOut, Award, CreditCard, Cpu, Sparkles, Mail } from 'lucide-react';
import logoImg from '../assets/logo.png';

const ProfilePage = () => {
    const { user, token, logout, refreshUser } = useAuth();
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

    const getRankProgress = (pts) => {
        let currentTier = 'Bronze';
        let nextTier = 'Silver';
        let minPts = 0;
        let maxPts = 25;

        if (pts >= 350) {
            currentTier = 'Radiant';
            nextTier = null;
            minPts = 350;
            maxPts = 350;
        } else if (pts >= 175) {
            currentTier = 'Platinum';
            nextTier = 'Radiant';
            minPts = 175;
            maxPts = 350;
        } else if (pts >= 75) {
            currentTier = 'Gold';
            nextTier = 'Platinum';
            minPts = 75;
            maxPts = 175;
        } else if (pts >= 25) {
            currentTier = 'Silver';
            nextTier = 'Gold';
            minPts = 25;
            maxPts = 75;
        } else {
            currentTier = 'Bronze';
            nextTier = 'Silver';
            minPts = 0;
            maxPts = 25;
        }

        const range = maxPts - minPts;
        const progress = range > 0 ? Math.min(100, Math.max(0, ((pts - minPts) / range) * 100)) : 100;
        const ptsNeeded = nextTier ? maxPts - pts : 0;

        return { currentTier, nextTier, progress, ptsNeeded };
    };

    useEffect(() => {
        document.title = "BlackByte | My Profile";
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
                if (import.meta.env.DEV) {
                    console.error("Failed to fetch history:", err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchHistory();
    }, [token, BASE_URL]);

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
                if (refreshUser) await refreshUser();
            } else {
                alert('Failed to add credits');
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error("Credit addition error:", error);
            alert('Error adding credits');
        } finally {
            setIsAddingCredits(false);
        }
    };

    const { currentTier, nextTier, progress, ptsNeeded } = getRankProgress(points);
    const rank = currentTier;
    const visibleHistory = history;

    const handleLogout = () => {
        localStorage.removeItem('token');
        logout();
        navigate('/', { replace: true });
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
                        {user?.role === 'admin' && (
                            <a href="/admin" className="nav-item admin-item"><Shield size={18} /> Admin Panel</a>
                        )}
                    </div>
                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <a href="/profile" className="nav-item active"><User size={18} /> Profile</a>
                        <a href="/settings" className="nav-item"><Settings size={18} /> Settings</a>
                        <button onClick={handleLogout} className="nav-item logout-btn"><LogOut size={18} /> Logout</button>
                    </div>
                </nav>
            </aside>

            <main className="dashboard-content">
                <header className="dashboard-header">
                    <div>
                        <h1>My Profile</h1>
                        <p>Manage your account and view your past activity.</p>
                    </div>
                </header>

                <div className="profile-container">
                    <div className="profile-details-card">
                        <div className="profile-card-header">
                            <div className="avatar-wrapper">
                                <div className="profile-avatar-large">
                                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className={`rank-badge-pill rank-${rank.toLowerCase()}`}>
                                    <Award size={14} style={{ marginRight: '4px' }} />
                                    {rank}
                                </span>
                            </div>
                            <div className="profile-user-info">
                                <h2>{user?.username}</h2>
                                <p className="profile-email"><Mail size={14} style={{ marginRight: '6px' }} /> {user?.email}</p>
                                <div className="points-display">
                                    <Sparkles size={16} className="pts-icon" style={{ marginRight: '6px' }} />
                                    <span className="points-count">{points}</span>
                                    <span className="points-label">Loyalty Points</span>
                                </div>
                            </div>
                        </div>
                        
                        {nextTier ? (
                            <div className="loyalty-progress-section">
                                <div className="progress-labels">
                                    <span className="current-milestone">{currentTier}</span>
                                    <span className="next-milestone-text">{ptsNeeded} pts to {nextTier}</span>
                                    <span className="next-milestone">{nextTier}</span>
                                </div>
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
                                        <div className="progress-glow"></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="loyalty-progress-section max-tier">
                                <div className="progress-labels">
                                    <span className="current-milestone">{currentTier} (Max Rank)</span>
                                    <span className="next-milestone-text">Congratulations, you have reached the maximum rank!</span>
                                </div>
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: '100%' }}>
                                        <div className="progress-glow"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="cyber-credit-card">
                        <div className="card-bg-glow"></div>
                        <div className="card-top">
                            <div className="card-brand">
                                <Cpu size={30} className="card-chip" />
                                <span className="brand-text">BlackByte VIP</span>
                            </div>
                            <div className="card-logo-container">
                                <CreditCard size={24} className="card-type-logo" />
                            </div>
                        </div>
                        <div className="card-middle">
                            <span className="card-number">
                                **** **** **** {user?.id ? String(user.id).padStart(4, '0').slice(-4) : '1337'}
                            </span>
                        </div>
                        <div className="card-bottom">
                            <div className="card-holder-info">
                                <span className="holder-label">Card Holder</span>
                                <span className="holder-name">{user?.username ? user.username.toUpperCase() : 'MEMBER'}</span>
                            </div>
                            <div className="card-balance-info">
                                <span className="balance-label">Balance</span>
                                <span className="balance-value">{Number(credits).toFixed(2)} CR</span>
                            </div>
                        </div>
                        <button className="card-topup-btn" onClick={() => setShowWalletModal(true)}>
                            <Plus size={16} /> Top Up Wallet
                        </button>
                    </div>

                    <div className="history-section">
                        <div className="panel-header">
                            <CalendarDays size={20} className="panel-header-icon" style={{ marginRight: '8px' }} />
                            <h3>Reservation History</h3>
                        </div>
                        <div className="table-container">
                            {isLoading ? (
                                <div className="history-loading">
                                    <p>Loading history...</p>
                                </div>
                            ) : visibleHistory.length === 0 ? (
                                <div className="history-empty">
                                    <CalendarDays size={48} className="empty-icon" />
                                    <p>You have no reservation history.</p>
                                </div>
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
                                            let badgeClass = 'upcoming';

                                            if (res.status === 'cancelled') {
                                                displayStatus = 'CANCELLED';
                                                badgeClass = 'completed';
                                            } else if (res.status === 'pending') {
                                                if (now > end) {
                                                    displayStatus = 'EXPIRED';
                                                    badgeClass = 'completed';
                                                } else {
                                                    displayStatus = 'PENDING';
                                                    badgeClass = 'pending';
                                                }
                                            } else {
                                                if (now > end) {
                                                    displayStatus = 'COMPLETED';
                                                    badgeClass = 'completed';
                                                } else if (now >= start && now <= end) {
                                                    displayStatus = 'ACTIVE';
                                                    badgeClass = 'active';
                                                }
                                            }

                                            return (
                                                <tr key={res.reservation_id}>
                                                    <td className="fw-bold">#RES-{res.reservation_id}</td>
                                                    <td className="pc-type-cell">
                                                        <span className="pc-badge">{(res.computer_type || 'Unknown').toUpperCase()}</span>
                                                    </td>
                                                    <td>{start.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td>{durationHrs} hour(s)</td>
                                                    <td><span className={`status-badge ${badgeClass}`}>{displayStatus}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {showWalletModal && (
                    <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Top Up Credits</h3>
                                <button className="modal-close" onClick={() => setShowWalletModal(false)}><X size={24} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="slider-container">
                                    <div className="slider-info">
                                        <span className="slider-label">Select Amount</span>
                                        <span className="slider-value">{creditSlider} CR</span>
                                    </div>
                                    <input type="range" min="20" max="1000" step="20" value={creditSlider} onChange={(e) => setCreditSlider(parseInt(e.target.value))} className="slider" />
                                    <div className="slider-marks"><span>20</span><span>500</span><span>1000</span></div>
                                </div>
                                <div className="credit-breakdown">
                                    <div className="breakdown-item"><span>Amount:</span><span className="amount">{creditSlider} CR</span></div>
                                    <div className="breakdown-item"><span>Current Balance:</span><span className="balance">{credits} CR</span></div>
                                    <div className="breakdown-item total"><span>New Balance:</span><span className="new-balance">{credits + creditSlider} CR</span></div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setShowWalletModal(false)} disabled={isAddingCredits}>Cancel</button>
                                <button className="btn-confirm" onClick={handleAddCredits} disabled={isAddingCredits}>{isAddingCredits ? 'Processing...' : `Add ${creditSlider} CR`}</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProfilePage;