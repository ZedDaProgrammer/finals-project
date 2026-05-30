import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRankDetails } from '../utils/rankHelper';
import logoImg from '../assets/logo.png';
import { 
    LayoutDashboard, 
    CalendarDays, 
    Shield, 
    User, 
    Settings, 
    LogOut, 
    ChevronLeft, 
    ChevronRight, 
    Menu 
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', isCollapsed);
    }, [isCollapsed]);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const points = user?.points || 0;
    const credits = user?.credits || 0;

    const rank = getRankDetails(points);

    return (
        <>
            {/* Mobile Header Bar */}
            <div className="mobile-header-bar">
                <div className="mobile-logo-container">
                    <img src={logoImg} alt="BlackByte Logo" className="mobile-logo" />
                    <span className="mobile-brand-name">BLACKBYTE</span>
                </div>
                <button className="mobile-hamburger" onClick={() => setIsMobileOpen(true)}>
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Overlay Backdrop */}
            <div 
                className={`sidebar-backdrop ${isMobileOpen ? 'active' : ''}`} 
                onClick={() => setIsMobileOpen(false)} 
            />

            {/* Sidebar */}
            <aside 
                className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
                style={{
                    '--rank-color': rank.color,
                    '--rank-glow': `0 0 10px ${rank.glow}`
                }}
            >
                <div className="sidebar-header">
                    <NavLink to="/dashboard" className="sidebar-logo-container" onClick={() => setIsMobileOpen(false)}>
                        <img src={logoImg} alt="BlackByte Logo" className="sidebar-logo" />
                        <span className="sidebar-brand-name">BLACKBYTE</span>
                    </NavLink>
                    <button 
                        className="sidebar-toggle-btn" 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <NavLink 
                            to="/dashboard" 
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                            {isCollapsed && <span className="sidebar-tooltip">Dashboard</span>}
                        </NavLink>
                        <NavLink 
                            to="/booking" 
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <CalendarDays size={18} />
                            <span>Reservation</span>
                            {isCollapsed && <span className="sidebar-tooltip">Reservation</span>}
                        </NavLink>
                        {user?.role === 'admin' && (
                            <NavLink 
                                to="/admin" 
                                className={({ isActive }) => `nav-item admin-item ${isActive ? 'active' : ''}`}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <Shield size={18} />
                                <span>Admin Panel</span>
                                {isCollapsed && <span className="sidebar-tooltip">Admin Panel</span>}
                            </NavLink>
                        )}
                    </div>

                    <div className="nav-section account-section">
                        <span className="nav-section-title">Account</span>
                        <NavLink 
                            to="/profile" 
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <User size={18} />
                            <span>Profile</span>
                            {isCollapsed && <span className="sidebar-tooltip">Profile</span>}
                        </NavLink>
                        <NavLink 
                            to="/settings" 
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <Settings size={18} />
                            <span>Settings</span>
                            {isCollapsed && <span className="sidebar-tooltip">Settings</span>}
                        </NavLink>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user-card">
                        <div className="user-card-info">
                            <div className="user-avatar-wrapper">
                                <div className="user-avatar">
                                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                            </div>
                            <div className="user-details">
                                <span className="user-name">{user?.username || 'Guest'}</span>
                                <span className="user-rank-badge">{rank.name}</span>
                            </div>
                        </div>

                        <div className="user-stats-row">
                            <span className="stat-label">Balance</span>
                            <span className="stat-value">{Number(credits).toFixed(2)} CR</span>
                        </div>

                        <button onClick={handleLogout} className="logout-nav-item">
                            <LogOut size={16} />
                            <span>Logout</span>
                            {isCollapsed && <span className="sidebar-tooltip">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
