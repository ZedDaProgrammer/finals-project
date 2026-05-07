const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/authMiddleware').isAdmin;
const token = require('../middleware/authMiddleware').token;
const pool = require('../database/db');

router.get('/admin', token, isAdmin, async (req, res) => {
    try {
        const allBookings = await pool.query(`
            SELECT r.id, r.start, r.end, r.status, u.username, c.name AS station_name
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN computers c ON r.station_id = c.id
            ORDER BY r.start DESC
        `);
        res.status(200).json({ bookings: allBookings.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error"});
    }
});

router.put('/admin/reservations/:status', token, isAdmin, async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    try {
        const updateStatus = await pool.query(
            `UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );
        if (updateStatus.rows.length === 0) {
            return res.status(404).json({ message: "Reservation not found"});
        }

        res.status(200).json({ message: "Status updated successfully", reservation: updateStatus.rows[0]});
        
} catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error"});
}
});

module.exports = router;