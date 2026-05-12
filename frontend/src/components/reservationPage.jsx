import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ReservationPage = () => {
    const { token, user, logout } = useAuth();
    const BASE_URL = 'http://localhost:3000/src/reservationRoute';

    const [allComputers, setAllComputers] = useState([]);
    const [availableIds, setAvailableIds] = useState([]);
    const [selectedPC, setSelectedPC] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null); // Added for room booking
    const [activeTab, setActiveTab] = useState('standard'); 
    
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000; 
        return (new Date(now - tzOffset)).toISOString().slice(0, 16);
    });
    
    const [duration, setDuration] = useState(1); 

    useEffect(() => {
        const fetchAllComputers = async () => {
            try {
                const response = await fetch(`${BASE_URL}/filter`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'all' })
                });
                if (response.ok) {
                    const data = await response.json();
                    setAllComputers(data);
                }
            } catch (error) { console.error("Error fetching computers:", error); }
        };
        if (token) fetchAllComputers();
    }, [token]);

    useEffect(() => {
        const checkAvailability = async () => {
            if (!startTime || !duration) return;
            const startTimestamp = new Date(startTime);
            const endTimestamp = new Date(startTimestamp.getTime() + duration * 60 * 60 * 1000);
            try {
                const response = await fetch(`${BASE_URL}/check?start=${startTimestamp.toISOString()}&end=${endTimestamp.toISOString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAvailableIds(data.availableStation.map(pc => pc.id));
                }
            } catch (error) { console.error("Error checking availability:", error); }
        };
        if (token) checkAvailability();
    }, [token, startTime, duration]);

    // Grouping Logic
    const standardPcs = allComputers.filter(pc => pc.type === 'standard');
    const allVipPcs = allComputers.filter(pc => pc.type === 'vip');
    
    // Slicing VIPs into categories
    const vipRoomPcs = allVipPcs.slice(0, 25); 
    const privateVipPcs = allVipPcs.slice(25, 35); 
    const generalVipPcs = allVipPcs.slice(35); // This shows the lounge if you have >35 VIPs

    const handleBooking = async () => {
        const isRoom = !!selectedRoom;
        const endpoint = isRoom ? '/group-booking' : '/book';
        const payload = isRoom ? {
            stations: selectedRoom.pcs.map(p => p.id),
            start: new Date(startTime).toISOString(),
            end: new Date(new Date(startTime).getTime() + duration * 36e5).toISOString()
        } : {
            station_id: selectedPC.id,
            start: new Date(startTime).toISOString(),
            end: new Date(new Date(startTime).getTime() + duration * 36e5).toISOString()
        };

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                alert("Booking Successful!");
                window.location.reload();
            } else {
                alert(`Booking failed: ${data.error}`);
            }
        } catch (error) { alert("An error occurred."); }
    };

    const renderPc = (pc) => {
        const isAvailable = availableIds.includes(pc.id);
        return (
            <div key={pc.id} className={`pc-seat ${isAvailable ? 'available' : 'occupied'}`} 
                 onClick={() => setSelectedPC(pc)}>
                <span className="pc-name">{pc.pcname}</span><br/>
                <span className="pc-rate">{pc.pc_rate} CR/hr</span>
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand"><h2>BlackByte</h2></div>
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item">Dashboard</a>
                        <a href="/booking" className="nav-item active">Reservation</a>
                    </div>
                </nav>
            </aside>

            <main className="dashboard-content">
                <div className="reservation-container">
                    <h2>Reservations</h2>
                    <div className="category-tabs">
                        <button className={`tab-btn ${activeTab === 'standard' ? 'active' : ''}`} onClick={() => setActiveTab('standard')}>Standard</button>
                        <button className={`tab-btn ${activeTab === 'vip_lounge' ? 'active' : ''}`} onClick={() => setActiveTab('vip_lounge')}>VIP Lounge</button>
                        <button className={`tab-btn ${activeTab === 'vip_rooms' ? 'active' : ''}`} onClick={() => setActiveTab('vip_rooms')}>VIP Rooms (5-PC)</button>
                        <button className={`tab-btn ${activeTab === 'private' ? 'active' : ''}`} onClick={() => setActiveTab('private')}>Private (2-PC)</button>
                    </div>

                    {activeTab === 'standard' && <div className="pc-grid">{standardPcs.map(renderPc)}</div>}
                    
                    {activeTab === 'vip_lounge' && (
                        <div className="pc-grid">
                            {generalVipPcs.length > 0 ? generalVipPcs.map(renderPc) : <p>Lounge is currently empty. Add more VIP PCs in database!</p>}
                        </div>
                    )}

                    {(activeTab === 'vip_rooms' || activeTab === 'private') && (
                        <div className="rooms-layout">
                            {[0,1,2,3,4].map(idx => {
                                const pcs = activeTab === 'vip_rooms' 
                                    ? vipRoomPcs.slice(idx*5, (idx+1)*5)
                                    : privateVipPcs.slice(idx*2, (idx+1)*2);
                                
                                if (pcs.length === 0) return null;
                                const isRoomAvailable = pcs.every(p => availableIds.includes(p.id));
                                const roomRate = pcs.reduce((sum, p) => sum + p.pc_rate, 0);

                                return (
                                    <div key={idx} className={`room-box ${isRoomAvailable ? '' : 'room-occupied'}`}>
                                        <h4>{activeTab === 'vip_rooms' ? 'VIP Room' : 'Private'} {idx + 1}</h4>
                                        <div className="pc-grid room-grid">
                                            {pcs.map(p => (
                                                <div key={p.id} className={`pc-mini ${availableIds.includes(p.id) ? 'free' : 'busy'}`}>
                                                    {p.pcname}
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            className="book-room-btn" 
                                            disabled={!isRoomAvailable}
                                            onClick={() => setSelectedRoom({ name: `Room ${idx+1}`, pcs, rate: roomRate })}
                                        >
                                            {isRoomAvailable ? `Book Room (${roomRate} CR/hr)` : 'Room Unavailable'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Unified Booking Modal */}
                {(selectedPC || selectedRoom) && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Confirm Booking for {selectedRoom ? selectedRoom.name : selectedPC.pcname}</h3>
                            <div className="modal-time-selector">
                                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                <input type="number" min="1" value={duration} onChange={e => setDuration(Number(e.target.value))} />
                            </div>
                            <div className="booking-summary">
                                <p><strong>Total Cost:</strong> {(selectedRoom ? selectedRoom.rate : selectedPC.pc_rate) * duration} CR</p>
                                <p><strong>Your Credits:</strong> {user?.credits} CR</p>
                            </div>
                            <div className="modal-actions">
                                <button className="confirm-btn" onClick={handleBooking}>Confirm</button>
                                <button className="cancel-btn" onClick={() => {setSelectedPC(null); setSelectedRoom(null);}}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReservationPage;