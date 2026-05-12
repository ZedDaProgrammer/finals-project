import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ReservationPage = () => {
    const { token } = useAuth();
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
                    end: endTimestamp.toISOString()
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Successfully booked ${selectedPC.pcname || `PC #${selectedPC.id}`}!`);
                setSelectedPC(null); // Close Modal
                setAvailableIds(prev => prev.filter(id => id !== selectedPC.id)); // Update Grid
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
                        
                        {/* Time Selectors MOVED INSIDE MODAL */}
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
                            </div>
                        )}

                        <div className="modal-actions">
                            <button 
                                className="confirm-btn" 
                                onClick={handleReservation}
                                disabled={!isSelectedPcAvailable}
                                style={{
                                    opacity: isSelectedPcAvailable ? 1 : 0.5,
                                    cursor: isSelectedPcAvailable ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Confirm Booking
                            </button>
                            <button className="cancel-btn" onClick={() => setSelectedPC(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationPage;