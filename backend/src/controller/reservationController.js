const pool = require('../database/db');

const getDashboardStats = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "User session expired." });
        }
        const user_id = req.user.id;
        
        const historyQuery = await pool.query(
            `SELECT COUNT(*) FROM reservations WHERE user_id = $1`,
            [user_id]
        );
        const totalBookedPc = parseInt(historyQuery.rows[0].count) || 0;

        const currentDate = new Date().toISOString();

        const availableQuery = await pool.query(
            `SELECT type, COUNT(*) as count FROM computers
             WHERE availability = 'available' 
             AND id NOT IN (
                 SELECT station_id FROM reservations
                 WHERE status != 'cancelled'
                 AND station_id IS NOT NULL
                 AND start <= $1
                 AND "end" >= $1
             )
             GROUP BY type`, [currentDate]
        );

     
        let availableStandardPc = 0;
        let availableVipPc = 0;

        availableQuery.rows.forEach(row => {
            if (row.type === 'standard') availableStandardPc = parseInt(row.count);
            if (row.type === 'vip') availableVipPc = parseInt(row.count);
        });

        res.status(200).json({
            totalBookedPc,
            availableStandardPc,
            availableVipPc
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err.message);
        res.status(500).json({ error: "Failed to load dashboard stats." });
    }
};

const checkAvailability = async (req, res) => {
    try{
        const { start, end } = req.query;
        if(!start || !end){
            return res.status(401).json({ error: "Please provide the needed details."});
        }

        const availableStation = await pool.query(`
                SELECT * FROM computers
                WHERE id NOT IN (
                    SELECT station_id FROM reservations
                    WHERE status != 'cancelled'
                    AND start < $2::timestamp
                    AND "end" > $1::timestamp
                    AND NOT (status = 'pending' AND CURRENT_TIMESTAMP > (start + INTERVAL '15 minutes'))
                )
                ORDER BY id ASC
            `, [start, end]);
            
        res.status(200).json({ availableStation: availableStation.rows });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error checking availability"});
    }
};

const createBooking = async (req, res) => {
    const { station_id, start, end } = req.body;
    const user_id = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Calculate duration and original cost
        const checkStation = await client.query(`SELECT * FROM computers WHERE id = $1 FOR UPDATE`, [station_id]);
        if (checkStation.rows.length === 0) throw new Error("Station not found.");
        
        const startTime = new Date(start);
        const endTime = new Date(end);
        const durationHours = Math.round(Math.abs(endTime - startTime) / 36e5); 
        const originalCost = (checkStation.rows[0].pc_rate || 0) * durationHours;

        // 2. Fetch User Rank from 'points' column
        const userQuery = await client.query(`SELECT credits, points FROM users WHERE id = $1 FOR UPDATE`, [user_id]);
        const userCredits = userQuery.rows[0].credits || 0;
        const currentPoints = userQuery.rows[0].points || 0;

        // 🌟 RANKING & DISCOUNT LOGIC
        let discountRate = 0;
        let rank = "Bronze";
        if (currentPoints >= 100) { discountRate = 0.15; rank = "Radiant"; }
        else if (currentPoints >= 60) { discountRate = 0.10; rank = "Platinum"; }
        else if (currentPoints >= 30) { discountRate = 0.06; rank = "Gold"; }
        else if (currentPoints >= 10) { discountRate = 0.03; rank = "Silver"; }

        const finalCost = Math.round(originalCost * (1 - discountRate));

        if (userCredits < finalCost) {
            throw new Error(`Rank ${rank} needs ${finalCost} CR, but you only have ${userCredits} CR.`);
        }

        // 🌟 EARN POINTS: 1 Point per Hour
        const earnedPoints = durationHours;

        // 3. Deduct Credits AND Add Points for free
        await client.query(
            `UPDATE users SET credits = credits - $1, points = points + $2 WHERE id = $3`,
            [finalCost, earnedPoints, user_id]
        );

        // 4. Create the Booking
        const newBooking = await client.query(`
            INSERT INTO reservations (user_id, station_id, start, "end", status)
            VALUES ($1, $2, $3 ,$4, 'pending') returning *`,
            [user_id, station_id, start, end]
        );

        await client.query('COMMIT');
        res.status(200).json({ 
            message: `Rank ${rank}: ${discountRate * 100}% Discount applied! Earned ${earnedPoints} points.`, 
            booking: newBooking.rows[0]
        });
    } catch(err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

const getHistory = async (req, res) => {
    const user_id = req.user.id;

    try{
        const historyQuery = await pool.query(
            `SELECT r.*, c.type AS computer_type
            FROM reservations r
            JOIN computers c ON r.station_id = c.id
            WHERE r.user_id = $1 
            ORDER BY r.start DESC`,
            [user_id]
        );

        const countQuery = await pool.query(
            `SELECT COUNT(*) FROM reservations WHERE user_id = $1`,
            [user_id]
        );
        

        res.status(200).json({ 
            history: historyQuery.rows,
            count: parseInt(countQuery.rows[0].count)
        });
    } catch (err) {
        console.error("History retrieval error", err.message);
        res.status(500).json({ error: "Server error during history retrieval"});
    }
};

const deleteBooking = async (req, res) => {
    const user_id = req.user.id;
    const reservation_id = req.params.id;

    try{
        const checkBooking = await pool.query(
            `SELECT * FROM reservations WHERE reservation_id = $1 AND user_id = $2`,
            [reservation_id, user_id]
        );

        if(checkBooking.rows.length === 0){
            return res.status(404).json({ error: "Booking not found or unautorized"});
        }

        await pool.query(
            `UPDATE reservations SET status = 'cancelled' WHERE reservation_id = $1`,
            [reservation_id]
        );

        res.status(200).json({ message: "Booking Cancelled Succesfully" });

    } catch (err) {
        console.error("Cancellation error:", err.message);
        res.status(500).json({ error: "Server error during cancellation" });
    }
};

const filterComputers = async (req, res) => {
    try {
        const { type } = req.body;
        
        let query = 'SELECT * FROM computers'; 
        let values = [];
        
        if (type && type !== 'all') {
            query += ' WHERE type = $1';
            values.push(type.toLowerCase());
        }
        
        query += ' ORDER BY id ASC';
        
        const computers = await pool.query(query, values);
        res.status(200).json(computers.rows);
    } catch (err) {
        console.error("Filter error:", err.message);
        res.status(500).json({ error: "Server error during filtering" });
    }
};

const upgradeMembership = async (req, res) => {
    const user_id = req.user.id;
    const { amount } = req.body;
    try {
        const user = await pool.query('SELECT points FROM users WHERE id = $1', [user_id]);
        const newPoints = (user.rows[0].points || 0) + Math.floor(amount / 10); 
        await pool.query('UPDATE users SET points = $1 WHERE id = $2', [newPoints, user_id]);
        res.status(200).json({ message: "Points updated", points: newPoints });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

const groupBooking = async (req, res) => {
    const { stations, start, end } = req.body;
    const user_id = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const checkStations = await client.query(
            `SELECT pc_rate FROM computers WHERE id = ANY($1)`,
            [stations]
        );

        if (checkStations.rows.length === 0) throw new Error("Stations not found.");
        const totalHourlyRate = checkStations.rows.reduce((sum, row) => sum + (row.pc_rate || 0), 0);

        const startTime = new Date(start);
        const endTime = new Date(end);
        const durationHours = Math.round(Math.abs(endTime - startTime) / 36e5); 
        const originalCost = totalHourlyRate * durationHours;

        const userQuery = await client.query(
            `SELECT credits, points FROM users WHERE id = $1 FOR UPDATE`,
            [user_id]
        );
        const userCredits = userQuery.rows[0].credits || 0;
        const currentPoints = userQuery.rows[0].points || 0;

        // 🌟 DISCOUNT LOGIC
        let discountRate = 0;
        if (currentPoints >= 1000) discountRate = 0.15;
        else if (currentPoints >= 600) discountRate = 0.10;
        else if (currentPoints >= 300) discountRate = 0.06;
        else if (currentPoints >= 100) discountRate = 0.03;

        const finalCost = Math.round(originalCost * (1 - discountRate));

        if (userCredits < finalCost) {
            throw new Error(`Insufficient credits. You need ${finalCost} CR (after discount), but only have ${userCredits} CR.`);
        }

        // 🌟 FREE POINTS EARNED (10 per hour per PC)
        const earnedPoints = durationHours * stations.length * 10;

        // Deduct FINAL COST and ADD earned Points
        await client.query(
            `UPDATE users SET credits = credits - $1, points = points + $2 WHERE id = $3`,
            [finalCost, earnedPoints, user_id]
        );

        const bookedStations = [];
        for (const station_id of stations) {
            const newBooking = await client.query(`
                INSERT INTO reservations (user_id, station_id, start, "end", status)
                VALUES ($1, $2, $3, $4, 'pending') returning *`,
                [user_id, station_id, start, end]
            );
            bookedStations.push(newBooking.rows[0]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: `Group booking confirmed! Discount applied: ${discountRate * 100}%. You earned ${earnedPoints} rank points!`, bookings: bookedStations });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Group Booking Error:", err.message);
        res.status(400).json({ error: err.message || "Failed to make group booking" });
    } finally {
        client.release();
    }
};

const createTicket = async (req, res) => {
    const user_id = req.user.id;
    const { subject, description, priority } = req.body;
    
    try {
        const newTicket = await pool.query(
            `INSERT INTO tickets (user_id, subject, description, priority, status)
             VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
            [user_id, subject, description, priority || 'normal']
        );
        
        res.status(201).json({ message: "Support ticket created", ticket: newTicket.rows[0] });
    } catch (err) {
        console.error("Ticket creation error:", err.message);
        res.status(500).json({ error: "Server error creating ticket" });
    }
};

const dashboardData = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "User session expired." });
        }
        const user_id = req.user.id;

        const activeSessions = await pool.query(`
            SELECT r.*, c.type AS computer_type
            FROM reservations r
            JOIN computers c ON r.station_id = c.id
            WHERE r.user_id = $1 
            AND r.status != 'cancelled'
            ORDER BY r.start DESC 
        `, [user_id]);
        
        res.status(200).json({ activeSessions: activeSessions.rows });
    } catch (err) {
        console.error("Dashboard data error", err.message);
        res.status(500).json({ error: "Server error during dashboard data retrieval" });
    }
};

module.exports = { 
    checkAvailability, 
    createBooking, 
    getHistory, 
    deleteBooking, 
    filterComputers, 
    upgradeMembership, 
    groupBooking, 
    createTicket, 
    getDashboardStats, 
    dashboardData 
};