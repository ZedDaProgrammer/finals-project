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

//get history
router.get('/history', async (req, res) =>{
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
});

//deleting function
router.delete('/:id', async (req, res) => {
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
});

router.post('/filter', async (req, res) => {
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
});


module.exports = router;