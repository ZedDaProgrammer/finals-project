import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../style.css'; 

const ReservationPage = () => {
    const { token } = useAuth();
    const BASE_URL = 'http://localhost:3000/src/reservationRoute';

    const [allComputers, setAllComputers] = useState([]);
    const [availableIds, setAvailableIds] = useState([]);
    const [selectedPC, setSelectedPC] = useState(null);
    
    // Time selection states
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        return now.toISOString().slice(0, 16); 
    });
    const [duration, setDuration] = useState(1); 

    // 1. Fetch all computers
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

    // 2. Check Availability based on time
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
                alert(`Successfully booked ${selectedPC.pcname || `PC #${selectedPC.id}`} for ${duration} hour(s)!`);
                setSelectedPC(null); 
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
            <h2>Reserve a PC</h2>
            
            <div className="time-selector">
                <div className="input-group">
                    <label>Start Date & Time:</label>
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
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* Render PC Grid */}
            <div className="pc-grid">
                {allComputers.map((pc) => {
                    const isAvailable = availableIds.includes(pc.id);
                    return (
                        <div 
                            key={pc.id} 
                            className={`pc-seat ${isAvailable ? 'available' : 'occupied'}`} 
                            onClick={() => handlePcClick(pc)}
                        >
                            {/* Uses the pcname from your database, fallback to ID if empty */}
                            {pc.pcname || `PC ${pc.id}`}
                            <br/>
                            <span className="pc-rate">{pc.type ? pc.type.toUpperCase() : ''}</span>
                        </div>
                    );
                })}
            </div>

            {/* Pop-up Modal */}
            {selectedPC && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Book {selectedPC.pcname || `PC #${selectedPC.id}`}</h3>
                        
                        <div className="pc-dynamic-details" style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
                            {/* Dynamically loops through EVERY column your DB returned for this PC */}
                            {Object.entries(selectedPC).map(([key, value]) => {
                                // You can hide redundant IDs if you want, but this maps all details
                                if (value === null || value === '') return null;
                                return (
                                    <p key={key} className="specs-text" style={{ margin: '4px 0' }}>
                                        <strong style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}:</strong> {String(value)}
                                    </p>
                                );
                            })}
                        </div>
                        
                        <p><strong>Start:</strong> {new Date(startTime).toLocaleString()}</p>
                        <p><strong>Duration:</strong> {duration} hour(s)</p>

                        <div className="modal-actions" style={{ marginTop: '20px' }}>
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