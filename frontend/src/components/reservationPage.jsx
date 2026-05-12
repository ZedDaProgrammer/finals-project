import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ReservationPage = () => {
    const { token, user, logout } = useAuth();
    const BASE_URL = 'http://localhost:3000/src/reservationRoute';

    const [allComputers, setAllComputers] = useState([]);
    const [availableIds, setAvailableIds] = useState([]);
    const [selectedPC, setSelectedPC] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null); 
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
    
    // Distributing the 20 VIP PCs:
    const generalVipPcs = allVipPcs.slice(0, 6);
    const vipRoomPcs = allVipPcs.slice(6, 16);     
    const privateVipPcs = allVipPcs.slice(16, 20);

    const handleBooking = async () => {
        const isRoom = !!selectedRoom;
        const endpoint = isRoom ? '/group-booking' : '/book';
        
        const startTimestamp = new Date(startTime);
        const endTimestamp = new Date(startTimestamp.getTime() + duration * 36e5);

        const payload = isRoom ? {
            stations: selectedRoom.pcs.map(p => p.id),
            start: startTimestamp.toISOString(),
            end: endTimestamp.toISOString()
        } : {
            station_id: selectedPC.id,
            start: startTimestamp.toISOString(),
            end: endTimestamp.toISOString(),
            total_price: (Number(selectedPC.pc_rate) || 0) * duration 
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
        } catch (error) { 
            alert("An error occurred while booking."); 
        }
    };

    const renderPc = (pc) => {
        const isAvailable = availableIds.includes(pc.id);
        return (
            <div key={pc.id} className={`pc-seat ${isAvailable ? 'available' : 'occupied'}`} 
                 // FIX: Removed the "if(isAvailable)" lock so you can always click it to open the modal
                 onClick={() => setSelectedPC(pc)}>
                <span className="pc-name">{pc.pcname || `PC-${pc.id}`}</span>
                <span className="pc-rate">{pc.pc_rate} CR/hr</span>
            </div>
        );
    };

    // Calculate if the specifically selected PC/Room is available for the active modal time
    const isSelectedAvailable = selectedRoom 
        ? selectedRoom.pcs.every(p => availableIds.includes(p.id))
        : (selectedPC ? availableIds.includes(selectedPC.id) : false);

    const targetRate = selectedRoom ? selectedRoom.rate : (selectedPC?.pc_rate || 0);
    const totalCost = targetRate * duration;
    const hasEnoughCredits = (user?.credits || 0) >= totalCost;
    const canBook = isSelectedAvailable && hasEnoughCredits;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand"><h2>BlackByte</h2></div>
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

            <main className="dashboard-content">
                <div className="reservation-container">
                    <h2>Reservations</h2>
                    <div className="category-tabs">
                        <button className={`tab-btn ${activeTab === 'standard' ? 'active' : ''}`} onClick={() => setActiveTab('standard')}>Standard Lounge</button>
                        <button className={`tab-btn ${activeTab === 'vip_lounge' ? 'active' : ''}`} onClick={() => setActiveTab('vip_lounge')}>VIP Lounge</button>
                        <button className={`tab-btn ${activeTab === 'vip_rooms' ? 'active' : ''}`} onClick={() => setActiveTab('vip_rooms')}>VIP Rooms (5-PC)</button>
                        <button className={`tab-btn ${activeTab === 'private' ? 'active' : ''}`} onClick={() => setActiveTab('private')}>Private (2-PC)</button>
                    </div>

                    {activeTab === 'standard' && <div className="pc-grid">{standardPcs.map(renderPc)}</div>}
                    
                    {activeTab === 'vip_lounge' && (
                        <div className="pc-grid">
                            {generalVipPcs.length > 0 ? generalVipPcs.map(renderPc) : <p style={{textAlign: "center", gridColumn: "1 / -1"}}>The VIP Lounge is currently empty. Check back later!</p>}
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
                                const roomRate = pcs.reduce((sum, p) => sum + (p.pc_rate || 0), 0);

                                return (
                                    <div key={idx} className={`room-box ${isRoomAvailable ? '' : 'room-occupied'}`}>
                                        <h4>{activeTab === 'vip_rooms' ? 'VIP Room' : 'Private Suite'} {idx + 1}</h4>
                                        <div className="room-grid">
                                            {pcs.map(p => (
                                                <div key={p.id} className={`pc-mini ${availableIds.includes(p.id) ? 'free' : 'busy'}`}>
                                                    {p.pcname || `PC-${p.id}`}
                                                </div>
                                            ))}
                                        </div>
                                        {/* FIX: Removed 'disabled' property so you can select occupied rooms to check future times */}
                                        <button 
                                            className="book-room-btn" 
                                            onClick={() => setSelectedRoom({ name: `${activeTab === 'vip_rooms' ? 'VIP Room' : 'Private Suite'} ${idx+1}`, pcs, rate: roomRate })}
                                        >
                                            Select Room ({roomRate} CR/hr)
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
                        <div className="modal-content modal-large">
                            <h3>Configure Booking for {selectedRoom ? selectedRoom.name : (selectedPC.pcname || `PC-${selectedPC.id}`)}</h3>
                            
                            {selectedPC && (
                                <div className="pc-dynamic-details">
                                    <h4>Specifications:</h4>
                                    <p className="specs-text"><strong>CPU:</strong> {selectedPC.cpu || 'N/A'}</p>
                                    <p className="specs-text"><strong>GPU:</strong> {selectedPC.gpu || 'N/A'}</p>
                                    <p className="specs-text"><strong>RAM:</strong> {selectedPC.ram ? `${selectedPC.ram} GB` : 'N/A'}</p>
                                    <p className="specs-text"><strong>Monitor:</strong> {selectedPC.monitor_hz ? `${selectedPC.monitor_hz} Hz` : 'N/A'}</p>
                                </div>
                            )}

                            {selectedRoom && (
                                <div className="pc-dynamic-details">
                                    <p style={{color: '#555', fontStyle: 'italic', marginBottom: '15px'}}>You are configuring a booking for all {selectedRoom.pcs.length} PCs in this room.</p>
                                </div>
                            )}

                            <div className="modal-time-selector" style={{ marginTop: '20px' }}>
                                <div className="input-group">
                                    <label>Start Time:</label>
                                    <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>Duration (Hours):</label>
                                    <input type="number" min="1" value={duration} onChange={e => setDuration(Number(e.target.value))} />
                                </div>
                            </div>

                            {/* Dynamic Warning if the selected time is occupied */}
                            {!isSelectedAvailable && (
                                <div className="booking-error" style={{marginTop: '10px', marginBottom: '0'}}>
                                    ⚠️ Currently occupied for the selected time. Please adjust the Start Time or Duration to find an open slot.
                                </div>
                            )}

                            <div className="booking-summary">
                                <hr style={{ margin: '15px 0', borderTop: '1px solid #ccc' }}/>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <strong>Total Cost:</strong> 
                                    <strong style={{ color: '#d84315', fontSize: '1.2em' }}>{totalCost} CR</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <strong>Your Credits:</strong> 
                                    <span style={{ color: hasEnoughCredits ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                                        {user?.credits || 0} CR
                                    </span>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button 
                                    className="confirm-btn" 
                                    onClick={handleBooking}
                                    disabled={!canBook}
                                    style={{ opacity: canBook ? 1 : 0.5, cursor: canBook ? 'pointer' : 'not-allowed' }}
                                >
                                    {hasEnoughCredits ? 'Confirm' : 'Insufficient Credits'}
                                </button>
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