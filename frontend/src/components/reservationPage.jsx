import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// Import your dynamic logo
import logoImg from '../../pictures/logo.png';

const ReservationPage = () => {
    const { token, user, logout } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const BASE_URL = `${API_URL}/api/reservation`;

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
    
    // NEW: State to control the success/error feedback modal
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: '', message: '' });

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

    const sortedComputers = [...allComputers].sort((a, b) => a.id - b.id);

    const allStandardPcs = sortedComputers.filter(pc => pc.type && pc.type.toLowerCase().trim() === 'standard');
    const standardPcs = allStandardPcs.slice(0, 20); 
    
    const allVipPcs = sortedComputers.filter(pc => pc.type && pc.type.toLowerCase().trim() === 'vip');
    
    const generalVipPcs = allVipPcs.slice(0, 20);      
    const vipRoomPcs = allVipPcs.slice(20, 45);        
    const privateVipPcs = allVipPcs.slice(45, 55);    

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
            
            // Replaced alert() with Custom Popup Modal Logic
            if (response.ok) {
                setFeedbackModal({ isOpen: true, type: 'success', message: 'Booking Successful!' });
            } else {
                setFeedbackModal({ isOpen: true, type: 'error', message: `Booking failed: ${data.error}` });
            }
        } catch (error) { 
            setFeedbackModal({ isOpen: true, type: 'error', message: 'An error occurred while booking. Please try again.' });
        }
    };

    // Handler to close the feedback modal
    const closeFeedbackModal = () => {
        // Only refresh the page if the booking was actually successful
        if (feedbackModal.type === 'success') {
            window.location.reload();
        } else {
            setFeedbackModal({ isOpen: false, type: '', message: '' });
        }
    };
    
    const [cpuFilter, setCpuFilter] = useState('all');
    const [gpuFilter, setGpuFilter] = useState('all');
    const [monitorFilter, setMonitorFilter] = useState('all');

    const isMatch = (pc) => {
         let match = true;
         if (cpuFilter !== 'all') {
             if (cpuFilter === 'Intel' && (!pc.cpu || !pc.cpu.toLowerCase().includes('i'))) match = false;
             if (cpuFilter === 'Ryzen' && (!pc.cpu || !pc.cpu.toLowerCase().includes('ryzen'))) match = false;
         }
         if (gpuFilter !== 'all') {
             if (gpuFilter === 'GTX' && (!pc.gpu || !pc.gpu.toLowerCase().includes('gtx'))) match = false;
             if (gpuFilter === 'RTX' && (!pc.gpu || !pc.gpu.toLowerCase().includes('rtx'))) match = false;
         }
         if (monitorFilter !== 'all') {
             if (monitorFilter === '144' && parseInt(pc.monitor_hz) !== 144) match = false;
             if (monitorFilter === '240' && parseInt(pc.monitor_hz) !== 240) match = false;
         }
         return match;
    };

    const renderPc = (pc) => {
        const isMaintenance = pc.availability === 'maintenance';
        // It's available only if it's not on maintenance AND the server's checkAvailability returned its ID
        const isAvailable = availableIds.includes(pc.id) && !isMaintenance;
        const match = isMatch(pc);
        
        return (
            <div key={pc.id} 
                 className={`pc-seat ${isMaintenance ? 'maintenance' : isAvailable ? 'available' : 'occupied'} ${match ? '' : 'unmatched-pc'}`} 
                 onClick={() => { if (match && !isMaintenance) setSelectedPC(pc); }}
                 style={{ 
                     opacity: match ? 1 : 0.3, 
                     cursor: isMaintenance ? 'not-allowed' : match ? 'pointer' : 'not-allowed', 
                     filter: isMaintenance || !match ? 'grayscale(100%)' : 'none',
                     pointerEvents: match && !isMaintenance ? 'auto' : 'none',
                     position: 'relative',
                     overflow: 'hidden'
                 }}>
                <span className="pc-name">{(pc.pc_name || pc.pcname) || `PC-${pc.id}`}</span>
                <span className="pc-rate">{pc.pc_rate} CR/hr</span>
                
                {/* Visual overlay for maintenance PCs */}
                {isMaintenance && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#ff4d4d',
                        fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px'
                    }}>
                        MAINTENANCE
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    {/* Dynamic logo implemented */}
                    <img src={logoImg} alt="BlackByte Logo" className="brand-logo" style={{ margin: '0 auto' }} />
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <span className="nav-section-title">Main Menu</span>
                        <a href="/dashboard" className="nav-item">Dashboard</a>
                        <a href="/booking" className="nav-item active">Reservation</a>
                        {user?.role === 'admin' && (
                            <a href="/admin" className="nav-item admin-item active">Admin Panel</a>
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
                    {(activeTab === 'standard' || activeTab === 'vip_lounge') && (
                        <div className="filters-container" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <select value={cpuFilter} onChange={e => setCpuFilter(e.target.value)} style={{ padding: '8px', borderRadius: '5px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}>
                                <option value="all">All CPUs</option>
                                <option value="Intel">Intel</option>
                                <option value="Ryzen">Ryzen</option>
                            </select>

                            <select value={gpuFilter} onChange={e => setGpuFilter(e.target.value)} style={{ padding: '8px', borderRadius: '5px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}>
                                <option value="all">All GPUs</option>
                                <option value="GTX">GTX</option>
                                <option value="RTX">RTX</option>
                            </select>

                            <select value={monitorFilter} onChange={e => setMonitorFilter(e.target.value)} style={{ padding: '8px', borderRadius: '5px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444' }}>
                                <option value="all">All Monitors</option>
                                <option value="144">144Hz</option>
                                <option value="240">240Hz</option>
                            </select>
                        </div>
                    )}

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
                                                    <div className="pc-name-label">{`VIP-${p.id}`}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            className="book-room-btn" 
                                            onClick={() => setSelectedRoom({ name: `${activeTab === 'vip_rooms' ? 'VIP Room' : 'Private Suite'} ${idx+1}`, pcs, rate: roomRate })}
                                        >
                                            Book Full Room ({roomRate} CR/hr)
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Main Unified Booking Modal */}
                {(selectedPC || selectedRoom) && (() => { 
                    const isCurrentlyAvailable = selectedRoom 
                        ? selectedRoom.pcs.every(p => availableIds.includes(p.id))
                        : (selectedPC && availableIds.includes(selectedPC.id));
                    
                    const targetRate = selectedRoom ? selectedRoom.rate : (selectedPC?.pc_rate || 0);
                    const totalCost = targetRate * duration;
                    const hasEnoughCredits = (user?.credits || 0) >= totalCost;

                    return (
                        <div className="modal-overlay">
                            <div className="modal-content modal-large">
                                <h3>Confirm Booking for {selectedRoom ? selectedRoom.name : ((selectedPC.pc_name || selectedPC.pcname) || `PC-${selectedPC.id}`)}</h3>
                                
                                {!selectedRoom && selectedPC && (
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
                                        <p style={{color: '#555', fontStyle: 'italic', marginBottom: '15px'}}>You are booking all {selectedRoom.pcs.length} PCs in this room for the selected time slot.</p>
                                        <h4>Room Specifications:</h4>
                                        <p className="specs-text"><strong>CPU:</strong> {selectedRoom.pcs[0]?.cpu || 'N/A'}</p>
                                        <p className="specs-text"><strong>GPU:</strong> {selectedRoom.pcs[0]?.gpu || 'N/A'}</p>
                                        <p className="specs-text"><strong>RAM:</strong> {selectedRoom.pcs[0]?.ram ? `${selectedRoom.pcs[0].ram} GB` : 'N/A'}</p>
                                        <p className="specs-text"><strong>Monitor:</strong> {selectedRoom.pcs[0]?.monitor_hz ? `${selectedRoom.pcs[0].monitor_hz} Hz` : 'N/A'}</p>
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

                                {!isCurrentlyAvailable && (
                                    <div style={{ color: '#dc3545', marginTop: '15px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '5px' }}>
                                        ⚠️ This {selectedRoom ? 'room' : 'PC'} is already booked during this time slot. Please adjust the Start Time or Duration.
                                    </div>
                                )}

                                <div className="booking-summary">
                                    <hr style={{ margin: '15px 0', borderTop: '1px solid #ccc' }}/>
                                    
                                    {(() => {
                                        const userPoints = user?.points || 0;
                                        let rank = "Bronze";
                                        let discountRate = 0;

                                        if (userPoints >= 350) { rank = "Radiant"; discountRate = 0.15; }
                                        else if (userPoints >= 175) { rank = "Platinum"; discountRate = 0.10; }
                                        else if (userPoints >= 75) { rank = "Gold"; discountRate = 0.06; }
                                        else if (userPoints >= 25) { rank = "Silver"; discountRate = 0.03; }

                                        const originalCost = targetRate * duration;
                                        const discountAmount = Math.round(originalCost * discountRate);
                                        const finalCost = originalCost - discountAmount;
                                        const hasEnoughCredits = (user?.credits || 0) >= finalCost;

                                        return (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <span>Original Price:</span>
                                                    <span>{originalCost} CR</span>
                                                </div>
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#28a745', fontSize: '0.9em' }}>
                                                    <span>Rank Discount ({rank}):</span>
                                                    <span>-{discountRate * 100}% ({discountAmount} CR)</span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                    <strong>Final Total Cost:</strong> 
                                                    <strong style={{ color: '#d84315', fontSize: '1.2em' }}>{finalCost} CR</strong>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                                    <strong>Your Credits:</strong> 
                                                    <span style={{ color: hasEnoughCredits ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                                                        {user?.credits || 0} CR
                                                    </span>
                                                </div>

                                                <div className="modal-actions">
                                                    <button 
                                                        className="confirm-btn" 
                                                        onClick={handleBooking}
                                                        disabled={!hasEnoughCredits || !isCurrentlyAvailable}
                                                        style={{ opacity: (hasEnoughCredits && isCurrentlyAvailable) ? 1 : 0.5 }}
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button className="cancel-btn" onClick={() => {setSelectedPC(null); setSelectedRoom(null);}}>Cancel</button>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* NEW: Feedback Modal for Success and Errors */}
                {feedbackModal.isOpen && (
                    <div className="modal-overlay" style={{ zIndex: 1100 }}>
                        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
                            <h3 style={{ 
                                color: feedbackModal.type === 'success' ? '#28a745' : '#dc3545', 
                                borderBottom: 'none', 
                                marginBottom: '10px',
                                fontSize: '24px'
                            }}>
                                {feedbackModal.type === 'success' ? '✅ Success' : '❌ Error'}
                            </h3>
                            <p style={{ fontSize: '16px', margin: '15px 0 25px 0', lineHeight: '1.5' }}>
                                {feedbackModal.message}
                            </p>
                            <button 
                                className="confirm-btn" 
                                onClick={closeFeedbackModal} 
                                style={{ 
                                    width: '100%', 
                                    background: feedbackModal.type === 'success' ? '#28a745' : '#dc3545',
                                    fontSize: '16px',
                                    padding: '12px'
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReservationPage;