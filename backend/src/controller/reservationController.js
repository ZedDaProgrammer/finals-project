const express = require('express');
const router = express.Router();
const { token, isAdmin } = require('../middleware/authMiddleware');
const pool = require('../database/db');

router.use(token);

const getDashboardStats = async (req, res) => {
    const user_id = req.user.id;
    
    try {
        const historyQuery = await pool.query(
            `SELECT COUNT(*) FROM reservations WHERE user_id = $1`,
            [user_id]
        );
        const totalBookedPc = parseInt(historyQuery.rows[0].count);

        // Simple query: Count all PCs NOT on maintenance and NOT currently reserved
        const availableQuery = await pool.query(
            `SELECT COUNT(*) as count FROM computers
             WHERE status != 'maintenance' 
             AND id NOT IN (
                 SELECT station_id FROM reservations
                 WHERE status != 'cancelled'
                 AND start <= NOW()
                 AND "end" >= NOW()
             )`
        );
        const availablePc = parseInt(availableQuery.rows[0].count);

        // Send exactly two clean numbers back to React
        res.status(200).json({
            totalBookedPc: totalBookedPc,
            availablePc: availablePc
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

const evaluatePoints = (points) => {
    if(points >= 100) return 'radiant';
    if(points >= 60) return 'platinum';
    if(points >= 30) return 'gold';
    if(points >= 10) return 'silver';
    return 'bronze';
}

//check for available pc without overlaping schedule
const availableStation = await pool.query(`
        SELECT * FROM computers
        WHERE id NOT IN (
        SELECT station_id FROM reservations
        WHERE status != 'cancelled'
        AND start < $2::timestamp
        AND "end" > $1::timestamp
        )
    `,[start, end]);
    res.status(200).json({
        message: "Available",
        count: availableStation.rows.length,
        available: availableStation.rows
    });

} catch(err){
    console.error("Availability checking error", err.message);
    res.status(500).json({ error: "Server checking availability error"});
}
};

//create booking
const createBooking = async (req, res) => {
    const { station_id, start, end } = req.body;
    const user_id = req.user.id;
    const client = await pool.connect();

    try{
        await client.query('BEGIN');

        const checkStation = await client.query(
            `SELECT * FROM computers WHERE id = $1 FOR UPDATE`,
            [station_id]
        );

        if(checkStation.rows.length === 0) throw new Error("Station not found.");

        const overlapChecking = await client.query(
            `SELECT * FROM reservations
            WHERE station_id = $1 AND status != 'cancelled'
            AND start < $3 AND "end" > $2`,
            [station_id, start, end]          
        );

        if(overlapChecking.rows.length > 0) throw new Error("Time slot unavailable");

        const newBooking = await client.query(`
            INSERT INTO reservations (user_id, station_id, start, "end", status)
            VALUES ($1, $2, $3 ,$4, 'pending') returning *`,
            [user_id, station_id, start, end]
        );
        if(newBooking.rows.length >0){
            const updatePoints = await pool.query(
                `UPDATE users SET points = points + 1 WHERE id = $1 RETURNING points`,
                [user_id]
            );
            const updatedPoints = updatePoints.rows[0].points;
            let currentRank = updatePoints.rows[0].rank;

            const earnnedRole = evaluatePoints(updatePoints);
            if(earnnedRole !== currentRank){
                await pool.query(`UPDATE users SET rank = $1 WHERE id = $2`, [earnnedRole, user_id]);
                console.log(`User ${user_id} leveled up to ${earnnedRole} rank!`);

                currentRank = earnnedRole;
            }
        }

        await client.query('COMMIT');
        res.status(202).json({
            message: "Booking created successfully",
            booking: newBooking.rows[0],
            points: updatedPoints,
            rank: currentRank
        });

    } catch (err){
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message});
    } finally {
        client.release();
    }
};

//get history
const getHistory = async (req, res) =>{
        const user_id = req.user.id;

        try{
            const history = await pool.query(`
                SELECT * FROM reservations
                WHERE user_id = $1
                ORDER BY start DESC`,
                [user_id]
            );

            res.status(200).json({
                count: history.rows.length,
                bookings: history.rows
            });

        } catch (err){
            console.error("History fetch error: ", err.message)
            res.status(500).json({ error: "Could not fetch history."});
        }
};

//deleting function
const deleteBooking = async (req, res) => {
    const reservation_id = req.params.id;
    const user_id = req.user.id;
    try{
        const deleteBooking = await pool.query(`
                DELETE FROM reservations
                WHERE reservation_id = $1 AND user_id = $2
                RETURNING *`,
                [reservation_id, user_id]
            );

            if (deleteBooking.rows.length === 0) {
                return res.status(404).json({ error: 'reservation not found'});
            }

            res.status(200).json({
                message : 'reservation successfully canceled',
                deleted: deleteBooking.rows[0]
            });

    } catch (err){
        console.error('Deletion error', err.message);
        res.status(500).json({ error: "Server error while canceling reservation"});
    }
};

//filtering drop down
const filterComputers = async (req, res) => {
    try{
        const { type, cpu, gpu, ram, min_hz } = req.body;
        let baseQuery = `SELECT * FROM computers`;
        const conditions = [];
        const values = [];

        if(type){
            values.push(type);
            conditions.push(`type = $${values.length}`);
        }

        if(cpu){
            values.push(`%${cpu}%`);
            conditions.push(`cpu ILIKE $${values.length}`);
        }

        if(gpu){
            values.push(`%${gpu}%`);
            conditions.push(`gpu ILIKE $${values.length}`);
        }

        if(ram){
            values.push(ram)
            conditions.push(`ram >= $${values.length}`);
        }

        if(min_hz){
            values.push(min_hz)
            conditions.push(`monitor_hz >= $${values.length}`);
        }

        if(conditions.length > 0){
            baseQuery += ` WHERE ` + conditions.join(' AND ');
        }

        const filteredPCs = await pool.query(baseQuery, values);

        res.status(200).json({
                count : filteredPCs.rows.length,
                results: filteredPCs.rows
            });
    } catch (err) {
        console.error("Filter Error:", err.message);
        res.status(500).json({ error: "Failed to filter computers."});
    }
};

const purchaseMembership = async (req, res) => {
    try{
        const upgradeQuery = await pool.query(
            `UPDATE users SET membership = 'member', rank = 'bronze' WHERE id = $1 RETURNING *`,
            [req.user.id]
        );
        if(upgradeQuery.rows.length === 0){
            return res.status(404).json({ message: "User not found"});
        }
        return upgradeQuery.rows[0];
    } catch (error) {
        console.error("Database error during upgrade", error.message);
        throw error;
    }
};

const upgradeMembership = async (req, res) => {
    try {
        const success = true;
        if(success){
            const upgradedUser = await upgradeBronze(req, res);
            return res.status(200).json({ message: "Membership upgraded to Silver", user: upgradedUser});
        } else {
            return res.status(400).json({ message: "Payment failed, upgrade unsuccessful"});
        }
    } catch (error) {
        res.status(500).json({ message: "Server error during upgrade"});
    }
};
//group-booking
const groupBooking = async (req, res) => {
    const { group_size, station_ids, start, end } = req.body;
    const user_id = req.user.id;
    const client = await pool.connect();
    const STANDARD_HOURLY_RATE = 10;
    const VIP_HOURLY_RATE = 20;


    if(group_size < 5){
        return res.status(400).json({ error: "Group size must be at least 5 for group booking."});
    }
    if(group_size > 10){
        return res.status(400).json({ error: "Group size cannot exceed 10 for group booking."});
    }
    if(station_ids.length !== group_size){
        return res.status(400).json({ error: "Number of station IDs must match the group size."});
    }

    try{
        const duration_ms = new Date(end) - new Date(start);
        const duration_hours = duration_ms / (1000 * 60 * 60);

        const discountCalculate = 0.10 + ((group_size - 5) * 0.02);
        const rawTotalPrice = group_size * STANDARD_HOURLY_RATE * duration_hours;
        const finalPrice = rawTotalPrice - discountCalculate;

        const bookingPromises = station_ids.map(station_id => {
            return client.query(`
                INSERT INTO reservations (user_id, station_id, start, "end", status)
                VALUES ($1, $2, $3, $4, $5)
            `, [user_id, station_id, start, end, 'confirmed']);
        });

        const saveBooking = await Promise.all(bookingPromises);

        const confirmedBookings = saveBooking.map(result => result.rows[0]);

        res.status(200).json({
            message: "Group booking successful",
            bookings: confirmedBookings,
            total_price: finalPrice,
            discount_applied: discountCalculate
        });
    } catch (err){
        console.error("Group booking error", err.message);
        res.status(500).json({ error: "Server error during group booking"});
    }
};

const createTicket = async (req, res) => {
    const { station_id, subject, descript } = req.body;
    const user_id = req.user.id;

    try{
        const newPost = await pool.query(`
            INSERT INTO posts (user_id, station_id, subject, descript)
            VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, station_id || null , subject, descript]
        );

        res.status(201).json({ 
            message: "Post created successfully", 
            post: newPost.rows[0] 
        });
    } catch (err) {
        console.error("Post creation error", err.message);
        res.status(500).json({ error: "Server error during post creation" });
    }
};

const dashboardData = async (req, res) => {
    const user_id = req.user.id;
    try {
        const upcomingReservations = await pool.query(`
            SELECT r.*, c.type AS computer_type FROM reservations r
            JOIN computers c ON r.station_id = c.id
            WHERE r.user_id = $1 AND r.start > NOW() AND r.status != 'cancelled'
            ORDER BY r.start ASC
            LIMIT 5`,
            [user_id]
        );
        res.status(200).json({ upcomingReservations: upcomingReservations.rows });
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