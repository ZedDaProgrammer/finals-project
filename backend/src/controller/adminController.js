const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/authMiddleware').isAdmin;
const token = require('../middleware/authMiddleware').token;
const pool = require('../database/db');

const getBookings = async (req, res) => {
    try {
        // REMOVED the aggressive DELETE query to stop it from wiping out your DB

        const allBookings = await pool.query(`
            SELECT 
                r.reservation_id, 
                r.start, 
                r."end", 
                r.status, 
                u.username, 
                c.id AS station_id
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN computers c ON r.station_id = c.id
            ORDER BY r.start DESC
        `);
        
        const formattedBookings = allBookings.rows.map(b => ({
            id: b.reservation_id,
            start: b.start,
            end: b.end,
            status: b.status,
            username: b.username,
            station_name: `PC-${b.station_id}` 
        }));

        res.status(200).json({ bookings: formattedBookings });
    } catch (error) {
        console.error("Database error in getBookings:", error); 
        res.status(500).json({ message: "Server error"});
    }
};

const updateReservationStatus = async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    try {
        const updateStatus = await pool.query(
            `UPDATE reservations SET status = $1 WHERE reservation_id = $2 RETURNING *`,
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
};

const getTicket = async (req, res) => {
    try {
        const tickets = await pool.query(`
            SELECT 
                t.id, 
                t.description AS issue,
                t.status, 
                u.username
            FROM tickets t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.status(200).json({ tickets: tickets.rows });
    } catch (error) {
        console.error("Ticket fetch error:", error);
        res.status(500).json({ message: "Server error"});
    }
};

const updateTicketStatus = async (req, res) => {
    const ticketId = req.params.id;
    const { status } = req.body;

    try {
        const updateTicket = await pool.query(
            `UPDATE tickets SET status = $1 WHERE id = $2 RETURNING *`,
            [status, ticketId]
        );
        
        if (updateTicket.rows.length === 0) {
            return res.status(404).json({ message: "Ticket not found"});
        }

        res.status(200).json({
             message: "Ticket status updated successfully", ticket: updateTicket.rows[0]
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error"});
        }
};

const deleteReservation = async (req, res) => {
    const id = req.params.id;
    try {
        const deleteObj = await pool.query(`DELETE FROM reservations WHERE reservation_id = $1 RETURNING *`, [id]);
        if (deleteObj.rows.length === 0) {
            return res.status(404).json({ message: "Reservation not found"});
        }
        res.status(200).json({ message: "Reservation deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error"});
    }
};

const getComputers = async (req, res) => {
    try {
        const computers = await pool.query(`SELECT * FROM computers ORDER BY id ASC`);
        res.status(200).json({ computers: computers.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error"});
    }
};

const updateComputerStatus = async (req, res) => {
    const id = req.params.id;
    const { availability } = req.body;
    try {
        const updateStatus = await pool.query(
            `UPDATE computers SET availability = $1 WHERE id = $2 RETURNING *`,
            [availability, id]
        );
        if (updateStatus.rows.length === 0) {
            return res.status(404).json({ message: "Computer not found"});
        }
        res.status(200).json({ message: "Status updated successfully", computer: updateStatus.rows[0]});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error"});
    }
};



module.exports = { 
    getBookings, 
    updateReservationStatus, 
    getTicket, 
    updateTicketStatus, 
    deleteReservation, 
    getComputers, 
    updateComputerStatus 
};
