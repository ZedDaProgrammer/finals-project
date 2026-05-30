import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { API_URL } from '../config';
import { getDiscountTier } from '../utils/rankHelper';
import Sidebar from '../components/Sidebar';
import { Monitor, Gem, Layers, ShieldCheck, Map, X, Calendar, Minus, Plus, Cpu, Tv, Database } from 'lucide-react';

// Import tab-specific layout blueprints from the assets folder
import standardLayoutImg from '../assets/standard_layout.jpg';
import vipLoungeLayoutImg from '../assets/vip.jpg';
import vipRoomsLayoutImg from '../assets/vip_room.jpg';
import privateLayoutImg from '../assets/private_lounge.jpg';

const ReservationPage = () => {
    const { token, user } = useAuth();
    const { showFeedback } = useFeedback();

    const BASE_URL = `${API_URL}/api/reservation`;

    const [allComputers, setAllComputers] = useState([]);
    const [availableIds, setAvailableIds] = useState([]);
    const [selectedPC, setSelectedPC] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [activeTab, setActiveTab] = useState('standard');
    const [isBooking, setIsBooking] = useState(false);
    const [showLayoutModal, setShowLayoutModal] = useState(false);
    const [imageError, setImageError] = useState(false);


    const getMinDateTime = () => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        return (new Date(now - tzOffset)).toISOString().slice(0, 16);
    };

    const [startTime, setStartTime] = useState(getMinDateTime);
    const [duration, setDuration] = useState(1);

    const handleStartTimeChange = (val) => {
        if (!val || val.length < 16) {
            setStartTime(val);
            return;
        }
        const minVal = getMinDateTime();
        if (val < minVal) {
            setStartTime(minVal);
            showFeedback('error', 'You cannot select a past date or time.');
        } else {
            setStartTime(val);
        }
    };

    useEffect(() => {
        document.title = "BlackByte | Book a PC";
    }, []);

    useEffect(() => {
        setImageError(false);
    }, [activeTab]);

    useEffect(() => {
        const fetchAllComputers = async () => {
            try {
                const response = await fetch(`${BASE_URL}/filter?type=all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAllComputers(data);
                }
            } catch (error) { if (import.meta.env.DEV) console.error("Error fetching computers:", error); }
        };
        if (token) fetchAllComputers();
    }, [token, BASE_URL]);

    // OPTIMIZATION #6: Debounce availability check to prevent API call on every keystroke
    useEffect(() => {
        const checkAvailability = async () => {
            if (!startTime || isNaN(Date.parse(startTime)) || !duration) return;
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
            } catch (error) { if (import.meta.env.DEV) console.error("Error checking availability:", error); }
        };
        const timer = setTimeout(() => {
            if (token) checkAvailability();
        }, 400);
        return () => clearTimeout(timer);
    }, [token, startTime, duration, BASE_URL]);

    const sortedComputers = useMemo(() => [...allComputers].sort((a, b) => a.id - b.id), [allComputers]);
    const allStandardPcs = useMemo(() => sortedComputers.filter(pc => pc.type && pc.type.toLowerCase().trim() === 'standard'), [sortedComputers]);
    const standardPcs = useMemo(() => allStandardPcs.slice(0, 20), [allStandardPcs]);
    const allVipPcs = useMemo(() => sortedComputers.filter(pc => pc.type && pc.type.toLowerCase().trim() === 'vip'), [sortedComputers]);
    const generalVipPcs = useMemo(() => allVipPcs.slice(0, 20), [allVipPcs]);
    const vipRoomPcs = useMemo(() => allVipPcs.slice(20, 45), [allVipPcs]);
    const privateVipPcs = useMemo(() => allVipPcs.slice(45, 55), [allVipPcs]);

    const handleBooking = async () => {
        if (isBooking) return;
        setIsBooking(true);

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
                // OPTIMIZATION #8: State-based refresh instead of full page reload
                showFeedback('success', 'Booking Successful!', () => {
                    setSelectedPC(null);
                    setSelectedRoom(null);
                    setIsBooking(false);
                    // Reset time to now to prevent booking in the past
                    setStartTime(getMinDateTime());
                });
            } else {
                showFeedback('error', `Booking failed: ${data.error}`);
                setIsBooking(false);
            }
        } catch (error) {
            showFeedback('error', 'An error occurred while booking. Please try again.');
            setIsBooking(false);
        }
    };

    const [cpuFilter, setCpuFilter] = useState('all');
    const [gpuFilter, setGpuFilter] = useState('all');
    const [monitorFilter, setMonitorFilter] = useState('all');

    // Reset specifications filters on active tab changes
    useEffect(() => {
        setCpuFilter('all');
        setGpuFilter('all');
        setMonitorFilter('all');
    }, [activeTab]);

    // Compute standard lounge or vip lounge machines lists relevant to current viewport filtering
    const currentTabPcs = useMemo(() => {
        if (activeTab === 'standard') return standardPcs;
        if (activeTab === 'vip_lounge') return generalVipPcs;
        return [];
    }, [activeTab, standardPcs, generalVipPcs]);

    // Parse unique CPU specifications available in the current active tab
    const availableCpus = useMemo(() => {
        const cpus = new Set();
        currentTabPcs.forEach(pc => {
            if (!pc.cpu) return;
            const cpuLower = pc.cpu.toLowerCase();
            if (cpuLower.includes('i') || cpuLower.includes('intel')) {
                cpus.add('Intel');
            }
            if (cpuLower.includes('ryzen')) {
                cpus.add('Ryzen');
            }
        });
        return Array.from(cpus);
    }, [currentTabPcs]);

    // Parse unique GPU specifications available in the current active tab
    const availableGpus = useMemo(() => {
        const gpus = new Set();
        currentTabPcs.forEach(pc => {
            if (!pc.gpu) return;
            const gpuLower = pc.gpu.toLowerCase();
            if (gpuLower.includes('gtx')) {
                gpus.add('GTX');
            }
            if (gpuLower.includes('rtx')) {
                gpus.add('RTX');
            }
        });
        return Array.from(gpus);
    }, [currentTabPcs]);

    // Parse unique Monitor refresh rates available in the current active tab
    const availableMonitors = useMemo(() => {
        const monitors = new Set();
        currentTabPcs.forEach(pc => {
            if (!pc.monitor_hz) return;
            const hz = parseInt(pc.monitor_hz);
            if (!isNaN(hz)) {
                monitors.add(hz.toString());
            }
        });
        return Array.from(monitors).sort((a, b) => parseInt(a) - parseInt(b));
    }, [currentTabPcs]);

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
            if (parseInt(pc.monitor_hz) !== parseInt(monitorFilter)) match = false;
        }
        return match;
    };

    const renderPc = (pc) => {
        const isMaintenance = pc.availability === 'maintenance';
        const isAvailable = availableIds.includes(pc.id) && !isMaintenance;
        const match = isMatch(pc);

        return (
            <div key={pc.id}
                className={`pc-card-premium ${isMaintenance ? 'maintenance' : isAvailable ? 'available' : 'occupied'} ${match ? '' : 'unmatched-pc'}`}
                onClick={() => { if (match && !isMaintenance) setSelectedPC(pc); }}
                style={{
                    opacity: match ? 1 : 0.15,
                    cursor: isMaintenance ? 'not-allowed' : match ? 'pointer' : 'not-allowed',
                    pointerEvents: match && !isMaintenance ? 'auto' : 'none',
                    position: 'relative'
                }}>
                
                {/* Card Header: Node ID & Status Pill */}
                <div className="pc-card-header">
                    <span className="pc-card-id">{(pc.pc_name || pc.pcname) || `PC-${pc.id}`}</span>
                    <span className={`pc-card-status-badge ${isMaintenance ? 'maintenance' : isAvailable ? 'free' : 'busy'}`}>
                        {isMaintenance ? 'MAINTENANCE' : isAvailable ? 'AVAILABLE' : 'IN USE'}
                    </span>
                </div>

                {/* Card Body: Specs & Visual */}
                <div className="pc-card-body">
                    <div className="pc-card-icon-wrapper">
                        <Monitor size={30} className="pc-card-icon" />
                    </div>
                    
                    {/* Specs Pills */}
                    <div className="pc-card-specs">
                        {pc.gpu && <span className="spec-badge gpu">{pc.gpu.split(' ').slice(-1)[0]}</span>}
                        {pc.monitor_hz && <span className="spec-badge hz">{pc.monitor_hz}Hz</span>}
                    </div>
                </div>

                {/* Card Footer: Rate & Select Trigger */}
                <div className="pc-card-footer">
                    <div className="pc-rate-container">
                        <span className="pc-rate-val">{pc.pc_rate}</span>
                        <span className="pc-rate-lbl">CR/hr</span>
                    </div>
                    <button className="pc-select-action-btn" disabled={isMaintenance || !isAvailable}>
                        {isMaintenance ? 'OFFLINE' : isAvailable ? 'BOOK' : 'BUSY'}
                    </button>
                </div>

                {isMaintenance && (
                    <div className="pc-maintenance-overlay">
                        <span>MAINTENANCE</span>
                    </div>
                )}
            </div>
        );
    };

    const getLayoutDetails = () => {
        switch (activeTab) {
            case 'standard':
                return {
                    title: 'Standard Lounge Layout Sector',
                    image: standardLayoutImg,
                    filename: 'standard_layout.png',
                    description: 'Station terminal nodes 1 to 20 spatial layout mapping configuration.'
                };
            case 'vip_lounge':
                return {
                    title: 'VIP Lounge Layout Sector',
                    image: vipLoungeLayoutImg,
                    filename: 'vip_lounge_layout.png',
                    description: 'Premium standalone workstation clusters configuration blueprint.'
                };
            case 'vip_rooms':
                return {
                    title: 'VIP 5-PC Team Rooms Sector',
                    image: vipRoomsLayoutImg,
                    filename: 'vip_rooms_layout.png',
                    description: 'Multi-seat localized team arena nodes setup layout (Rooms 1 to 5).'
                };
            case 'private':
                return {
                    title: 'Private Dual 2-PC Suites Sector',
                    image: privateLayoutImg,
                    filename: 'private_layout.png',
                    description: 'Dual isolation pod suites arrangement setup architecture (Suites 1 to 5).'
                };
            default:
                return { title: 'Lounge Workspace Blueprint', image: null, filename: '', description: '' };
        }
    };



    const layoutDetails = getLayoutDetails();
    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-content">
                <div className="reservation-container">
                    <h2>Reservations</h2>

                    <div className="category-tabs">
                        <button className={`tab-btn ${activeTab === 'standard' ? 'active' : ''}`} onClick={() => setActiveTab('standard')}><Monitor size={16} /> Standard Lounge</button>
                        <button className={`tab-btn ${activeTab === 'vip_lounge' ? 'active' : ''}`} onClick={() => setActiveTab('vip_lounge')}><Gem size={16} /> VIP Lounge</button>
                        <button className={`tab-btn ${activeTab === 'vip_rooms' ? 'active' : ''}`} onClick={() => setActiveTab('vip_rooms')}><Layers size={16} /> VIP Rooms (5-PC)</button>
                        <button className={`tab-btn ${activeTab === 'private' ? 'active' : ''}`} onClick={() => setActiveTab('private')}><ShieldCheck size={16} /> Private (2-PC)</button>
                    </div>


                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
                        <button
                            className="layout-toggle-btn"
                            onClick={() => setShowLayoutModal(true)}
                        >
                            <Map size={16} />
                            Show Room PC Layout
                        </button>
                    </div>

                    {(activeTab === 'standard' || activeTab === 'vip_lounge') && (
                        <div className="filters-container">
                            <select value={cpuFilter} onChange={e => setCpuFilter(e.target.value)} className="filter-select">
                                <option value="all">All CPUs</option>
                                {availableCpus.map(cpu => (
                                    <option key={cpu} value={cpu}>{cpu}</option>
                                ))}
                            </select>
                            <select value={gpuFilter} onChange={e => setGpuFilter(e.target.value)} className="filter-select">
                                <option value="all">All GPUs</option>
                                {availableGpus.map(gpu => (
                                    <option key={gpu} value={gpu}>{gpu}</option>
                                ))}
                            </select>
                            <select value={monitorFilter} onChange={e => setMonitorFilter(e.target.value)} className="filter-select">
                                <option value="all">All Monitors</option>
                                {availableMonitors.map(hz => (
                                    <option key={hz} value={hz}>{hz}Hz</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {activeTab === 'standard' && <div className="pc-grid">{standardPcs.map(renderPc)}</div>}
                    {activeTab === 'vip_lounge' && <div className="pc-grid">{generalVipPcs.map(renderPc)}</div>}

                    {(activeTab === 'vip_rooms' || activeTab === 'private') && (
                        <div className="rooms-layout">
                            {[0, 1, 2, 3, 4].map(idx => {
                                const pcs = activeTab === 'vip_rooms'
                                    ? vipRoomPcs.slice(idx * 5, (idx + 1) * 5)
                                    : privateVipPcs.slice(idx * 2, (idx + 1) * 2);

                                if (pcs.length === 0) return null;
                                const isRoomAvailable = pcs.every(p => availableIds.includes(p.id));
                                const roomRate = pcs.reduce((sum, p) => sum + (p.pc_rate || 0), 0);

                                return (
                                    <div key={idx} className={`room-box ${isRoomAvailable ? 'available' : 'occupied'}`}>
                                        <div className="room-header">
                                            <h4>{activeTab === 'vip_rooms' ? 'VIP Team Room' : 'Private Pod Suite'} {idx + 1}</h4>
                                            <span className={`room-status-badge ${isRoomAvailable ? 'free' : 'busy'}`}>
                                                {isRoomAvailable ? 'ALL SYSTEMS GO' : 'IN USE'}
                                            </span>
                                        </div>

                                        <div className="room-specs-preview">
                                            <div className="spec-tag"><strong>CPU:</strong> {pcs[0]?.cpu || 'N/A'}</div>
                                            <div className="spec-tag"><strong>GPU:</strong> {pcs[0]?.gpu || 'N/A'}</div>
                                            <div className="spec-tag"><strong>RAM:</strong> {pcs[0]?.ram ? `${pcs[0].ram} GB` : 'N/A'}</div>
                                            <div className="spec-tag"><strong>Monitor:</strong> {pcs[0]?.monitor_hz ? `${pcs[0].monitor_hz}Hz` : 'N/A'}</div>
                                        </div>

                                        <div className="room-grid">
                                            {pcs.map(p => {
                                                const isAvailable = availableIds.includes(p.id);
                                                return (
                                                    <div key={p.id} className={`pc-mini ${isAvailable ? 'free' : 'busy'}`}>
                                                        <Monitor size={16} />
                                                        <div className="pc-name-label">{`Node-${p.id}`}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button
                                            className="book-room-btn"
                                            onClick={() => setSelectedRoom({ name: `${activeTab === 'vip_rooms' ? 'VIP Room' : 'Private Suite'} ${idx + 1}`, pcs, rate: roomRate })}
                                            disabled={!isRoomAvailable}
                                        >
                                            {isRoomAvailable ? `Book Full Room (${roomRate} CR/hr)` : 'Room Unavailable'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Confirm Booking Modal Dialog */}
                {(selectedPC || selectedRoom) && (() => {
                    const isCurrentlyAvailable = selectedRoom
                        ? selectedRoom.pcs.every(p => availableIds.includes(p.id))
                        : (selectedPC && availableIds.includes(selectedPC.id));

                    const targetRate = selectedRoom ? selectedRoom.rate : (selectedPC?.pc_rate || 0);


                    return (
                        <div className="modal-overlay">
                            <div className="modal-content reservation-booking-modal">
                                <div className="modal-header">
                                    <h3>Confirm Booking</h3>
                                    <button className="modal-close" onClick={() => { setSelectedPC(null); setSelectedRoom(null); }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <div className="booking-target-banner">
                                        <span>Target Station:</span>
                                        <strong>{selectedRoom ? selectedRoom.name : ((selectedPC.pc_name || selectedPC.pcname) || `PC-${selectedPC.id}`)}</strong>
                                    </div>

                                    {!selectedRoom && selectedPC && (
                                        <div className="modal-specs-grid">
                                            <div className="modal-spec-card">
                                                <div className="modal-spec-card-icon">
                                                    <Cpu size={18} />
                                                </div>
                                                <div className="modal-spec-card-info">
                                                    <span className="modal-spec-label">Processor</span>
                                                    <span className="modal-spec-value">{selectedPC.cpu || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="modal-spec-card">
                                                <div className="modal-spec-card-icon">
                                                    <Monitor size={18} />
                                                </div>
                                                <div className="modal-spec-card-info">
                                                    <span className="modal-spec-label">Graphics</span>
                                                    <span className="modal-spec-value">{selectedPC.gpu || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="modal-spec-card">
                                                <div className="modal-spec-card-icon">
                                                    <Database size={18} />
                                                </div>
                                                <div className="modal-spec-card-info">
                                                    <span className="modal-spec-label">Memory</span>
                                                    <span className="modal-spec-value">{selectedPC.ram ? `${selectedPC.ram} GB` : 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="modal-spec-card">
                                                <div className="modal-spec-card-icon">
                                                    <Tv size={18} />
                                                </div>
                                                <div className="modal-spec-card-info">
                                                    <span className="modal-spec-label">Refresh Rate</span>
                                                    <span className="modal-spec-value">{selectedPC.monitor_hz ? `${selectedPC.monitor_hz} Hz` : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedRoom && (
                                        <>
                                            <div className="room-warning-banner">
                                                <span><strong>Group Session:</strong> You are reserving all {selectedRoom.pcs.length} workstation nodes in {selectedRoom.name} simultaneously for the specified time slot.</span>
                                            </div>
                                            <div className="modal-specs-grid">
                                                <div className="modal-spec-card">
                                                    <div className="modal-spec-card-icon">
                                                        <Cpu size={18} />
                                                    </div>
                                                    <div className="modal-spec-card-info">
                                                        <span className="modal-spec-label">Processor</span>
                                                        <span className="modal-spec-value">{selectedRoom.pcs[0]?.cpu || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div className="modal-spec-card">
                                                    <div className="modal-spec-card-icon">
                                                        <Monitor size={18} />
                                                    </div>
                                                    <div className="modal-spec-card-info">
                                                        <span className="modal-spec-label">Graphics</span>
                                                        <span className="modal-spec-value">{selectedRoom.pcs[0]?.gpu || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div className="modal-spec-card">
                                                    <div className="modal-spec-card-icon">
                                                        <Database size={18} />
                                                    </div>
                                                    <div className="modal-spec-card-info">
                                                        <span className="modal-spec-label">Memory</span>
                                                        <span className="modal-spec-value">{selectedRoom.pcs[0]?.ram ? `${selectedRoom.pcs[0].ram} GB` : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div className="modal-spec-card">
                                                    <div className="modal-spec-card-icon">
                                                        <Tv size={18} />
                                                    </div>
                                                    <div className="modal-spec-card-info">
                                                        <span className="modal-spec-label">Refresh Rate</span>
                                                        <span className="modal-spec-value">{selectedRoom.pcs[0]?.monitor_hz ? `${selectedRoom.pcs[0].monitor_hz} Hz` : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="modal-time-selector">
                                        <div className="input-group">
                                            <label>Start Time:</label>
                                            <div className="stylish-input-wrapper">
                                                <Calendar size={16} className="input-icon" />
                                                <input
                                                    type="datetime-local"
                                                    min={getMinDateTime()}
                                                    value={startTime}
                                                    onChange={e => handleStartTimeChange(e.target.value)}
                                                    className="stylish-datetime-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Duration (Hours):</label>
                                            <div className="duration-stepper">
                                                <button
                                                    type="button"
                                                    className="stepper-btn"
                                                    onClick={() => setDuration(prev => Math.max(1, prev - 1))}
                                                    disabled={duration <= 1}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="stepper-value">{duration} {duration === 1 ? 'hr' : 'hrs'}</span>
                                                <button
                                                    type="button"
                                                    className="stepper-btn"
                                                    onClick={() => setDuration(prev => Math.min(24, prev + 1))}
                                                    disabled={duration >= 24}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCurrentlyAvailable && (
                                        <div className="booking-warning-alert">
                                            This {selectedRoom ? 'room' : 'PC'} is already booked during this time slot. Please adjust parameters.
                                        </div>
                                    )}

                                    <div className="booking-summary">
                                        {(() => {
                                            const userPoints = user?.points || 0;
                                            const { rate: discountRate, rank } = getDiscountTier(userPoints);
                                            const originalCost = targetRate * duration;
                                            const discountAmount = Math.round(originalCost * discountRate);
                                            const finalCost = originalCost - discountAmount;
                                            const hasEnoughCredits = (user?.credits || 0) >= finalCost;

                                            return (
                                                <>
                                                    <div className="digital-ticket">
                                                        <div className="receipt-row">
                                                            <span>Original Rate:</span>
                                                            <span>{originalCost} CR</span>
                                                        </div>

                                                        <div className="receipt-row discount">
                                                            <span>Rank Discount ({rank}):</span>
                                                            <span>-{discountRate * 100}% (-{discountAmount} CR)</span>
                                                        </div>

                                                        <div className="receipt-row total">
                                                            <span>Final Total Cost:</span>
                                                            <span className="price-amount">{finalCost} CR</span>
                                                        </div>

                                                        <div className="receipt-row balance">
                                                            <span>Your Credits:</span>
                                                            <span className={hasEnoughCredits ? "credit-sufficient" : "credit-insufficient"}>
                                                                {user?.credits || 0} CR
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="modal-actions">
                                                        <button
                                                            className="confirm-btn"
                                                            onClick={handleBooking}
                                                            disabled={!hasEnoughCredits || !isCurrentlyAvailable || isBooking}
                                                            style={{ opacity: (hasEnoughCredits && isCurrentlyAvailable && !isBooking) ? 1 : 0.5 }}
                                                        >
                                                            {isBooking ? 'Processing...' : 'Confirm'}
                                                        </button>
                                                        <button className="cancel-btn" onClick={() => { setSelectedPC(null); setSelectedRoom(null); }}>Cancel</button>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Tab-Specific Room Layout Image Modal View */}
                {showLayoutModal && (
                    <div className="modal-overlay" onClick={() => setShowLayoutModal(false)}>
                        {/* Enlarged configuration viewport mapping window class applied */}
                        <div className="modal-content modal-xlarge" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{layoutDetails.title}</h3>
                                <button className="modal-close" onClick={() => setShowLayoutModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="layout-image-wrapper" style={{ margin: '15px 0', textAlign: 'center' }}>
                                    {!imageError && layoutDetails.image ? (
                                        <img
                                            src={layoutDetails.image}
                                            alt={layoutDetails.title}
                                            onError={() => setImageError(true)}
                                            style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
                                        />
                                    ) : (
                                        <div className="layout-image-placeholder">
                                            <div className="placeholder-icon-wrapper">
                                                <Map size={44} style={{ color: '#e94560', marginBottom: '10px' }} />
                                            </div>
                                            <span className="placeholder-text">{layoutDetails.title} Blueprint Placeholder</span>
                                            <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#8d99ae', lineHeight: '1.4' }}>
                                                Image file missing. Place a <strong>{layoutDetails.filename}</strong> image asset file inside your <code>frontend/src/assets/</code> directory workspace to swap this dashboard placeholder out.
                                            </p>
                                        </div>
                                    )}
                                    <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#6c757d', fontWeight: '500', lineHeight: '1.5' }}>
                                        {layoutDetails.description}
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setShowLayoutModal(false)}>Close View</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ReservationPage;