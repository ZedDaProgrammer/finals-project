const pool = require('../database/db');
const { getDiscountTier } = require('./utils/discountHelper');

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

        // OPTIMIZATION: Swapped 'NOT IN' for 'NOT EXISTS' for better execution plan
        const availableQuery = await pool.query(
            `SELECT c.type, COUNT(*) as count FROM computers c
             WHERE c.availability = 'available' 
             AND NOT EXISTS (
                 SELECT 1 FROM reservations r
                 WHERE r.station_id = c.id
                 AND r.status != 'cancelled'
                 AND r.start <= $1
                 AND r."end" >= $1
             )
             GROUP BY c.type`, [currentDate]
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
        if (process.env.NODE_ENV === 'development') {
            console.error("Dashboard Stats Error:", err.message);
        }
        res.status(500).json({ error: "Failed to load dashboard stats." });
    }
};

const checkAvailability = async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(401).json({ error: "Please provide the needed details."});
        }

        // OPTIMIZATION: Swapped 'NOT IN' for 'NOT EXISTS'
        const availableStation = await pool.query(`
                SELECT c.* FROM computers c
                WHERE NOT EXISTS (
                    SELECT 1 FROM reservations r
                    WHERE r.station_id = c.id
                    AND r.status != 'cancelled'
                    AND r.start < $2::timestamp
                    AND r."end" > $1::timestamp
                    AND NOT (r.status = 'pending' AND CURRENT_TIMESTAMP > (r.start + INTERVAL '15 minutes'))
                )
                ORDER BY c.id ASC
            `, [start, end]);
             
        res.status(200).json({ availableStation: availableStation.rows });

    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error(err.message);
        }
        res.status(500).json({ error: "Server error checking availability"});
    }
};

const createBooking = async (req, res) => {
    const { station_id, start, end } = req.body;
    const user_id = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const checkStation = await client.query(`SELECT * FROM computers WHERE id = $1 FOR UPDATE`, [station_id]);
        if (checkStation.rows.length === 0) throw new Error("Station not found.");

        const overlapping = await client.query(`
            SELECT 1 FROM reservations
            WHERE station_id = $1
            AND status != 'cancelled'
            AND start < $3::timestamp
            AND "end" > $2::timestamp
            AND NOT (status = 'pending' AND CURRENT_TIMESTAMP > (start + INTERVAL '15 minutes'))
            LIMIT 1
        `, [station_id, start, end]);

        if (overlapping.rows.length > 0) {
            throw new Error("This station is already booked during the selected time slot.");
        }
        
        const startTime = new Date(start);
        const endTime = new Date(end);
        const durationHours = Math.round(Math.abs(endTime - startTime) / 36e5); 
        const originalCost = (checkStation.rows[0].pc_rate || 0) * durationHours;

        const userQuery = await client.query(`SELECT credits, points FROM users WHERE id = $1 FOR UPDATE`, [user_id]);
        const userCredits = userQuery.rows[0].credits || 0;
        const currentPoints = userQuery.rows[0].points || 0;

        // OPTIMIZATION: Use extracted discount helper function
        const { rate: discountRate, rank } = getDiscountTier(currentPoints);
        const finalCost = Math.round(originalCost * (1 - discountRate));

        if (userCredits < finalCost) {
            throw new Error(`Rank ${rank} needs ${finalCost} CR, but you only have ${userCredits} CR.`);
        }

        const earnedPoints = durationHours;

        await client.query(
            `UPDATE users SET credits = credits - $1, points = points + $2 WHERE id = $3`,
            [finalCost, earnedPoints, user_id]
        );

        const newBooking = await client.query(`
            INSERT INTO reservations (user_id, station_id, start, "end", status)
            VALUES ($1, $2, $3 ,$4, 'pending') returning *`,
            [user_id, station_id, start, end]
        );

        await client.query('COMMIT');
        res.status(200).json({ 
            message: `Rank ${rank}: ${discountRate * 100}% Discount applied! Earned ${earnedPoints} rank points.`, 
            booking: newBooking.rows[0]
        });
    } catch(err) {
        await client.query('ROLLBACK');
        if (process.env.NODE_ENV === 'development') {
            console.error("Booking Error", err.message);
        }
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

const getHistory = async (req, res) => {
    const user_id = req.user.id;
    // OPTIMIZATION: Implemented pagination to prevent fetching massive payloads
    const limit = req.query.limit ? parseInt(req.query.limit) : 1000;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const [historyQuery, countQuery] = await Promise.all([
            pool.query(
                `SELECT r.*, c.type AS computer_type
                FROM reservations r
                JOIN computers c ON r.station_id = c.id
                WHERE r.user_id = $1 
                ORDER BY r.start DESC
                LIMIT $2 OFFSET $3`,
                [user_id, limit, offset]
            ),
            pool.query(
                `SELECT COUNT(*) FROM reservations WHERE user_id = $1`,
                [user_id]
            )
        ]);

        res.status(200).json({ 
            history: historyQuery.rows,
            count: parseInt(countQuery.rows[0].count)
        });
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error("History retrieval error", err.message);
        }
        res.status(500).json({ error: "Server error during history retrieval"});
    }
};

const deleteBooking = async (req, res) => {
    const user_id = req.user.id;
    const reservation_id = req.params.id;

    try {
        const checkBooking = await pool.query(
            `SELECT * FROM reservations WHERE reservation_id = $1 AND user_id = $2`,
            [reservation_id, user_id]
        );

        if (checkBooking.rows.length === 0) {
            return res.status(404).json({ error: "Booking not found or unauthorized"});
        }

        await pool.query(
            `UPDATE reservations SET status = 'cancelled' WHERE reservation_id = $1`,
            [reservation_id]
        );

        res.status(200).json({ message: "Booking Cancelled Successfully" });

    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Cancellation error:", err.message);
        }
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
        if (process.env.NODE_ENV === 'development') {
            console.error("Filter error:", err.message);
        }
        res.status(500).json({ error: "Server error during filtering" });
    }
};

const upgradeMembership = async (req, res) => {
    const user_id = req.user.id;
    const { amount } = req.body;
    try {
        const user = await pool.query('SELECT points FROM users WHERE id = $1', [user_id]);
        const newPoints = (user.rows[0].points || 0) + Math.floor(amount / 50); 
        
        await pool.query('UPDATE users SET points = $1 WHERE id = $2', [newPoints, user_id]);
        res.status(200).json({ message: "Points updated", points: newPoints });
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Membership upgrade error:", err.message);
        }
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

        const overlapping = await client.query(`
            SELECT station_id FROM reservations
            WHERE station_id = ANY($1::int[])
            AND status != 'cancelled'
            AND start < $3::timestamp
            AND "end" > $2::timestamp
            AND NOT (status = 'pending' AND CURRENT_TIMESTAMP > (start + INTERVAL '15 minutes'))
            LIMIT 1
        `, [stations, start, end]);

        if (overlapping.rows.length > 0) {
            throw new Error(`Station PC-${overlapping.rows[0].station_id} is already booked during the selected time slot.`);
        }

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

        // OPTIMIZATION: Use extracted discount helper function
        const { rate: discountRate, rank } = getDiscountTier(currentPoints);
        const finalCost = Math.round(originalCost * (1 - discountRate));

        if (userCredits < finalCost) {
            throw new Error(`Rank ${rank} needs ${finalCost} CR (after discount), but only have ${userCredits} CR.`);
        }

        const earnedPoints = durationHours * stations.length;

        await client.query(
            `UPDATE users SET credits = credits - $1, points = points + $2 WHERE id = $3`,
            [finalCost, earnedPoints, user_id]
        );

        // OPTIMIZATION: Replaced the N+1 `for` loop with a single batch insertion using `unnest`
        const newBookings = await client.query(`
            INSERT INTO reservations (user_id, station_id, start, "end", status)
            SELECT $1, unnest($2::int[]), $3, $4, 'pending'
            RETURNING *`,
            [user_id, stations, start, end]
        );

        await client.query('COMMIT');
        res.status(200).json({ 
            message: `Group booking confirmed! ${discountRate * 100}% Discount applied. Earned ${earnedPoints} rank points!`, 
            bookings: newBookings.rows 
        });
    } catch (err) {
        await client.query('ROLLBACK');
        if (process.env.NODE_ENV === 'development') {
            console.error("Group Booking Error:", err.message);
        }
        res.status(400).json({ error: err.message || "Failed to make group booking" });
    } finally {
        client.release();
    }
};

const createTicket = async (req, res) => {
    const user_id = req.user.id;
    const { station_id, subject, description } = req.body;  
    const safeStationId = (station_id === '' || !station_id) ? null : parseInt(station_id);

    try {
        const newTicket = await pool.query(
            `INSERT INTO tickets (user_id, station_id, subject, description, status)
             VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
            [user_id, safeStationId, subject, description] 
        );
        
        res.status(201).json({ message: "Support ticket created", ticket: newTicket.rows[0] });
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Ticket creation error:", err.message);
        }
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
        if (process.env.NODE_ENV === 'development') {
            console.error("Dashboard data error", err.message);
        }
        res.status(500).json({ error: "Server error during dashboard data retrieval" });
    }
};

const getUserTickets = async (req, res) => {
    try {
        const tickets = await pool.query('SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.status(200).json({ tickets: tickets.rows });
    } catch (error) { 
        if (process.env.NODE_ENV === 'development') {
            console.error("Ticket retrieval error:", error.message);
        }
        res.status(500).json({ message: "Server error" }); 
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
    dashboardData,
    getUserTickets
};
