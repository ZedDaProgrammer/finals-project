import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ReservationPage = () => {
    const { token } = useAuth();
    const BASE_URL = 'http://localhost:3000/src/reservationRoute'; // Ensure this matches your backend URL

    const [allComputers, setAllComputers] = useState([]);
    const [availableIds, setAvailableIds] = useState([]);
    const [selectedPC, setSelectedPC] = useState(null);
    
    // Time and Date selection states
    const [startTime, setStartTime] = useState(() => {
        // Default to the next nearest hour
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        return now.toISOString().slice(0, 16); 
    });
    
    // Duration in 1-hour increments
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

    // Check which computers are available based on the selected date/time
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
        const isAvailable = availableIds.includes(pc.id);
        if (isAvailable) {
            setSelectedPC(pc);
        }
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
                
                // Optimistically update the UI by removing the booked PC from available IDs
                setAvailableIds(prev => prev.filter(id => id !== selectedPC.id));
            } else {
                alert(`Booking failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Error confirming booking:", error);
            alert("An error occurred while booking.");
        }
    };

    return (
        <div className="reservation-container">
            <h2>Station Reservations</h2>
            
            {/* Top Bar for selecting Date, Time and Duration */}
            <div className="time-selector">
                <div className="input-group">
                    <label>Select Date & Start Time:</label>
                    <input 
                        type="datetime-local" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label>Duration (1 Hour Increments):</label>
                    <input 
                        type="number" 
                        min="1" 
                        step="1"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* PC Grid Layout */}
            <div className="pc-grid">
                {allComputers.map((pc) => {
                    const isAvailable = availableIds.includes(pc.id);
                    return (
                        <div 
                            key={pc.id} 
                            className={`pc-seat ${isAvailable ? 'available' : 'occupied'}`} 
                            onClick={() => handlePcClick(pc)}
                            title={isAvailable ? "Click to Book" : "Currently Occupied"}
                        >
                            <span className="pc-name">{pc.pcname || `PC ${pc.id}`}</span>
                            <br/>
                            <span className="pc-rate">{pc.type ? pc.type.toUpperCase() : ''}</span>
                        </div>
                    );
                })}
            </div>

            {/* Pop-up Modal with Database Specifications */}
            {selectedPC && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Book {selectedPC.pcname || `PC #${selectedPC.id}`}</h3>
                        
                        {/* Dynamic Specifications Block */}
                        <div className="pc-dynamic-details">
                            <h4>PC Specifications:</h4>
                            {Object.entries(selectedPC).map(([key, value]) => {
                                // Skip empty values, system IDs, or status flags to keep the modal clean
                                if (value === null || value === '' || key === 'id' || key === 'status') return null;
                                return (
                                    <p key={key} className="specs-text">
                                        <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {String(value)}
                                    </p>
                                );
                            })}
                        </div>
                        
                        <div className="booking-summary">
                            <p><strong>Booking Start:</strong> {new Date(startTime).toLocaleString()}</p>
                            <p><strong>Total Duration:</strong> {duration} hour(s)</p>
                        </div>

                        <div className="modal-actions">
                            <button className="confirm-btn" onClick={handleReservation}>Confirm Booking</button>
                            <button className="cancel-btn" onClick={() => setSelectedPC(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationPage;