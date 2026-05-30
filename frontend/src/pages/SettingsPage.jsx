import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';

import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';
import { Moon, KeyRound, Laptop } from 'lucide-react';

const SettingsPage = () => {
    const { token } = useAuth();
    const { showFeedback } = useFeedback();


    const BASE_URL = `${API_URL}/api`;

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [selectedPcType, setSelectedPcType] = useState('standard');
    const [ticket, setTicket] = useState({ station_id: '1', subject: '', description: '' });

    const handlePcTypeChange = (type) => {
        setSelectedPcType(type);
        setTicket(prev => ({
            ...prev,
            station_id: type === 'standard' ? '1' : '21'
        }));
    };

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    useEffect(() => {
        document.title = "BlackByte | Settings";
    }, []);

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
        
        // QA CHECK: Validate password length and ensure fields aren't whitespace-only.
        if (!passwords.current.trim() || !passwords.new.trim()) {
            showFeedback('error', "Password fields cannot be empty or spaces only.");
            return;
        }
        if (passwords.new.length < 6) {
            showFeedback('error', "New password must be at least 6 characters long.");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            showFeedback('error', "Passwords do not match");
            return;
        }

        try {
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
        } catch (error) {
            if (import.meta.env.DEV) console.error("Password change error:", error);
            showFeedback('error', "Network error. Please try again later.");
        }
    };

    const handleSubmitTicket = async (e) => {
        e.preventDefault();

        // QA CHECK: Validate subject and description are not empty or whitespace-only to prevent blank tickets.
        if (!ticket.subject.trim() || !ticket.description.trim()) {
            showFeedback('error', "Subject and description fields cannot be empty or only spaces.");
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/reservation/ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(ticket)
            });

            if (res.ok) {
                showFeedback('success', "Support ticket submitted! An admin will review it shortly.");
                setTicket({ station_id: selectedPcType === 'standard' ? '1' : '21', subject: '', description: '' });
            } else {
                showFeedback('error', "Failed to submit ticket. Try again later.");
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error("Ticket submission error:", error);
            showFeedback('error', "Network error. Please try again later.");
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-content">
                <div className="settings-container-layout">
                    <header className="dashboard-header">
                        <div>
                            <h1>Settings & Preferences</h1>
                            <p>Manage system theme visibility, update security credentials, or file support tickets.</p>
                        </div>
                    </header>

                    <div className="settings-grid-layout">
                        {/* Appearance / Dark Mode */}
                        <section className="settings-card appearance-card">
                            <h3><Moon size={20} className="card-header-icon" /> System Presentation</h3>
                            <p className="settings-card-desc">Customize the visual theme of your member workstation portal interface.</p>
                            <div className="theme-switch-wrapper">
                                <div className="theme-details">
                                    <strong>Dark Mode Theme</strong>
                                    <span>Enhance display contrast and reduce eye fatigue.</span>
                                </div>
                                <label className="theme-switch" htmlFor="checkbox">
                                    <input type="checkbox" id="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
                                    <div className="toggle-slider round"></div>
                                </label>
                            </div>
                        </section>

                        {/* Password Change */}
                        <section className="settings-card security-card">
                            <h3><KeyRound size={20} className="card-header-icon" /> Security & Credentials</h3>
                            <p className="settings-card-desc">Update your passphrase periodically to enforce account authentication integrity.</p>
                            <form onSubmit={handleChangePassword} className="security-settings-form">
                                <div className="form-group-full">
                                    <label>Current Passphrase</label>
                                    <input type="password" className="form-input" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group-half">
                                        <label>New Passphrase</label>
                                        <input type="password" className="form-input" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} required />
                                    </div>
                                    <div className="form-group-half">
                                        <label>Confirm Passphrase</label>
                                        <input type="password" className="form-input" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} required />
                                    </div>
                                </div>
                                <button type="submit" className="settings-btn secondary-btn">Update Password</button>
                            </form>
                        </section>

                        {/* Support Ticket */}
                        <section className="settings-card support-card">
                            <h3><Laptop size={20} className="card-header-icon" /> Admin Technical Support</h3>
                            <p className="settings-card-desc">File a fault ticket for terminal hardware issues, disconnected peripherals, or network faults.</p>
                            <form onSubmit={handleSubmitTicket} className="support-settings-form">
                                <div className="form-row">
                                    <div className="form-group-half">
                                        <label>PC Type</label>
                                        <select 
                                            className="form-input" 
                                            value={selectedPcType} 
                                            onChange={e => handlePcTypeChange(e.target.value)}
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="vip">VIP</option>
                                        </select>
                                    </div>
                                    <div className="form-group-half">
                                        <label>PC Station Number</label>
                                        <select 
                                            className="form-input" 
                                            value={ticket.station_id} 
                                            onChange={e => setTicket({ ...ticket, station_id: e.target.value })}
                                        >
                                            {selectedPcType === 'standard' 
                                                ? Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                                                    <option key={num} value={num}>Standard PC {num}</option>
                                                  ))
                                                : Array.from({ length: 55 }, (_, i) => i + 21).map(num => (
                                                    <option key={num} value={num}>VIP PC {num}</option>
                                                  ))
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group-full">
                                    <label>Fault Classification Subject</label>
                                    <input type="text" className="form-input" placeholder="e.g. Mouse Left-Click Unresponsive" value={ticket.subject} onChange={e => setTicket({ ...ticket, subject: e.target.value })} required />
                                </div>
                                <div className="form-group-full textarea-group">
                                    <label>System Diagnostics Description</label>
                                    <textarea className="form-input text-area" placeholder="Describe context, symptoms, hardware issues, or peripheral faults..." value={ticket.description} onChange={e => setTicket({ ...ticket, description: e.target.value })} required style={{ minHeight: '140px' }} />
                                </div>
                                <button type="submit" className="settings-btn primary-btn">Dispatch Ticket</button>
                            </form>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;