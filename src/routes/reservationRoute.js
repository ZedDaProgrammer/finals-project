const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const pool = require('../database/db');

router.use(protect);

router.get('/availability', async (req, res) => {
try{
const { start, end} = req.query;

if(!start || !end){
    return res.status(401).json({ error: "Please provide the needed details."});
}

const availableStation = await pool.query(`
        SELECT * FROM computers
        WHERE id NOT IN (
        SELECT station_id FROM reservations
        WHERE status != 'canceled'
        AND start < $2
        AND "end" > $1
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


module.exports = router;