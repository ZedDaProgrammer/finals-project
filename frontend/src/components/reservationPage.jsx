import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ReservationPage = () => {
    const { token, user, logout } = useAuth();
    const BASE_URL = 'http://localhost:3000/src/reservationRoute'; // Update to /api if needed based on our previous fix

    const [allComputers, setAllComputers] = useState([]);
    const [availableIds, setAvailableIds] = useState([]);
    const [selectedPC, setSelectedPC] = useState(null);
    
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        // REMOVED: now.setHours(...) so it defaults to the exact current time
        const tzOffset = now.getTimezoneOffset() * 60000; 
        return (new Date(now - tzOffset)).toISOString().slice(0, 16);
    });
    
    const [duration, setDuration] = useState(1); 

    // Fetch all computers from the database on page load
    useEffect(() => {
        const fetchAllComputers = async () => {
            try {
                const response = await fetch(`${BASE_URL}/filter`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type: 'all' })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setAllComputers(data);
                }
            } catch (error) {
                console.error("Error fetching computers:", error);
            }
        };

        if (token) fetchAllComputers();
    }, [token]);

    // Check availability dynamically whenever time/duration changes
    useEffect(() => {
        const checkAvailability = async () => {
            if (!startTime || !duration) return;

            const startTimestamp = new Date(startTime);
            const endTimestamp = new Date(startTimestamp.getTime() + duration * 60 * 60 * 1000);

            try {
                const response = await fetch(`${BASE_URL}/check?start=${startTimestamp.toISOString()}&end=${endTimestamp.toISOString()}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const availableIds = data.availableStation.map(pc => pc.id);
                    setAvailableIds(availableIds);
                }
            } catch (error) {
                console.error("Error checking availability:", error);
            }
        };

        if (token) checkAvailability();
    }, [token, startTime, duration]);


    const handlePcClick = (pc) => {
        setSelectedPC(pc);
    };

    const handleReservation = async () => {
        const startTimestamp = new Date(startTime);
        const endTimestamp = new Date(startTimestamp.getTime() + duration * 60 * 60 * 1000);

        try {
            const response = await fetch(`${BASE_URL}/book`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    station_id: selectedPC.id,
                    start: startTimestamp.toISOString(),
                    end: endTimestamp.toISOString(),
                    total_price: (Number(selectedPC.pc_rate) || 0) * duration  // <-- Add this line
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Successfully booked ${selectedPC.pcname || `PC #${selectedPC.id}`}!`);
                setSelectedPC(null); // Close Modal
                setAvailableIds(prev => prev.filter(id => id !== selectedPC.id)); // Update Grid
                window.location.reload(); 
            } else {
                alert(`Booking failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Error confirming booking:", error);
            alert("An error occurred while booking.");
        }
    };

    // Determine if the currently viewed PC in the modal is free
    const isSelectedPcAvailable = selectedPC ? availableIds.includes(selectedPC.id) : false;

    return (
        <div className="dashboard-layout">
            {/* --- SIDEBAR --- */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>BlackByte</h2>
                </div>
                
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item">Dashboard</a>
                        <a href="/booking" className="nav-item active">Reservation</a>                      
                        {user?.role === 'admin' && (
                            <a href="/admin" className="nav-item admin-item">Admin Panel</a>
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

            {/* --- MAIN CONTENT AREA --- */}
            <main className="dashboard-content">
                <div className="reservation-container">
                    <h2>Station Reservations</h2>
                    <p style={{marginBottom: "30px", color: "#555"}}>Select a station below to view specs and book your time.</p>

                    {/* PC Grid Layout */}
                    <div className="pc-grid">
                        {allComputers.map((pc) => {
                            const isAvailable = availableIds.includes(pc.id);
                            return (
                                <div 
                                    key={pc.id} 
                                    className={`pc-seat ${isAvailable ? 'available' : 'occupied'}`} 
                                    onClick={() => handlePcClick(pc)}
                                    title={isAvailable ? "Click to Book" : "Currently Occupied for the default time"}
                                >
                                    <span className="pc-name">{pc.pcname || `PC ${pc.id}`}</span>
                                    <br/>
                                    <span className="pc-rate">{pc.type ? pc.type.toUpperCase() : ''}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pop-up Modal */}
                    {selectedPC && (
                        <div className="modal-overlay">
                            <div className="modal-content modal-large">
                                <h3>Book {selectedPC.pcname || `PC #${selectedPC.id}`}</h3>
                                
                                {/* Specifications Block */}
                                <div className="pc-dynamic-details">
                                    <h4>PC Specifications:</h4>
                                    {Object.entries(selectedPC).map(([key, value]) => {
                                        if (value === null || value === '' || key === 'id' || key === 'status') return null;
                                        const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                                        return (
                                            <p key={key} className="specs-text">
                                                <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {displayValue}
                                            </p>
                                        );
                                    })}
                                </div>
                                
                                {/* Time Selectors */}
                                <div className="modal-time-selector">
                                    <div className="input-group">
                                        <label>Select Date & Start Time:</label>
                                        <input 
                                            type="datetime-local" 
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Duration (Hours):</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            step="1"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Validation: Check if available */}
                                {!isSelectedPcAvailable ? (
                                    <div className="booking-error">
                                        ⚠️ This PC is already booked for the selected time. Please choose a different time or PC.
                                    </div>
                                ) : (
                                    <div className="booking-summary">
                                        <p><strong>Booking Start:</strong> {new Date(startTime).toLocaleString()}</p>
                                        <p><strong>Total Duration:</strong> {duration} hour(s)</p>
                                        
                                        {/* Total Price & Balance Calculation */}
                                        <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ffcc80' }}/>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <p style={{ margin: 0 }}><strong>Rate per Hour:</strong></p>
                                            <p style={{ margin: 0 }}>{selectedPC.pc_rate || 0} CR</p>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', fontSize: '1.1em' }}>
                                            <p style={{ margin: 0 }}><strong>Total Price:</strong></p>
                                            <p style={{ margin: 0, color: '#d84315', fontWeight: 'bold' }}>
                                                {(Number(selectedPC.pc_rate) || 0) * duration} CR
                                            </p>
                                        </div>

                                        {/* Show Remaining Balance */}
                                        {/* Show Remaining Balance */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', fontSize: '0.95em', color: (user?.credits || 0) >= ((Number(selectedPC.pc_rate) || 0) * duration) ? '#4CAF50' : '#f44336' }}>
                                            <p style={{ margin: 0 }}><strong>Your Current Balance:</strong></p>
                                            <p style={{ margin: 0 }}>{user?.credits || 0} CR</p>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button 
                                        className="confirm-btn" 
                                        onClick={() => {
                                            const totalCost = (Number(selectedPC.pc_rate) || 0) * duration;
                                            if ((user?.credits || 0) < totalCost) {
                                                alert("You do not have enough credits!");
                                                return;
                                            }
                                            handleReservation();
                                        }}
                                        disabled={!isSelectedPcAvailable || (user?.credits || 0) < ((Number(selectedPC.pc_rate) || 0) * duration)}
                                        style={{
                                            opacity: isSelectedPcAvailable && (user?.credits || 0) >= ((Number(selectedPC.pc_rate) || 0) * duration) ? 1 : 0.5,
                                            cursor: isSelectedPcAvailable && (user?.credits || 0) >= ((Number(selectedPC.pc_rate) || 0) * duration) ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {(user?.credits || 0) >= ((Number(selectedPC.pc_rate) || 0) * duration) ? 'Confirm Booking' : 'Insufficient Credits'}
                                    </button>
                                    <button className="cancel-btn" onClick={() => setSelectedPC(null)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReservationPage;