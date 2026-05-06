const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const pool = require('../database/db');

router.use(protect);

router.get('/availability', async (req, res) => {
try{
const { start, end } = req.query;

if(!start || !end){
    return res.status(401).json({ error: "Please provide the needed details."});
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
});

//create booking
router.post('/', async (req, res) => {
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

        await client.query('COMMIT');
        res.status(201).json(newBooking.rows[0]);

    } catch (err){
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message});
    } finally {
        client.release();
    }
});


module.exports = router;