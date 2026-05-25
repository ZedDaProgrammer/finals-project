const pool = require('../database/db');

// OPTIMIZATION: Added pagination to prevent loading huge datasets
const getBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 1000;
        const offset = (page - 1) * limit;

        const [bookingsQuery, countQuery] = await Promise.all([
            pool.query(`
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
                LIMIT $1 OFFSET $2
            `, [limit, offset]),
            pool.query('SELECT COUNT(*) FROM reservations')
        ]);
        
        const formattedBookings = bookingsQuery.rows.map(b => ({
            id: b.reservation_id,
            start: b.start,
            end: b.end,
            status: b.status,
            username: b.username,
            station_name: `PC-${b.station_id}` 
        }));

        res.status(200).json({ 
            bookings: formattedBookings,
            pagination: {
                page,
                limit,
                total: parseInt(countQuery.rows[0].count),
                pages: Math.ceil(parseInt(countQuery.rows[0].count) / limit)
            }
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Database error in getBookings:", error);
        }
        res.status(500).json({ message: "Server error"});
    }
};

const updateReservationStatus = async (req, res) => {
    const id = req.params.id;
    // Extract the perfectly formatted local times from React
    const { status, start, end } = req.body; 

    try {
        // Retrieve target reservation to check if it belongs to a group booking
        const targetRes = await pool.query('SELECT * FROM reservations WHERE reservation_id = $1', [id]);
        if (targetRes.rows.length === 0) {
            return res.status(404).json({ message: "Reservation not found"});
        }
        
        const original = targetRes.rows[0];
        let query = `UPDATE reservations SET status = $1 WHERE reservation_id = $2 RETURNING *`;
        let values = [status, id];
        
        // Save the exact local times the frontend sent us!
        // If updating a pending reservation to active, also start any matching group reservations
        if (status === 'active' && original.status === 'pending' && start && end) {
            query = `
                UPDATE reservations 
                SET status = $1, start = $3, "end" = $4
                WHERE (reservation_id = $2 OR (user_id = $5 AND start = $6 AND "end" = $7 AND status = 'pending'))
                RETURNING *
            `;
            values = [status, id, start, end, original.user_id, original.start, original.end];
        }

        const updateStatus = await pool.query(query, values);
        
        res.status(200).json({ message: "Status updated successfully", reservation: updateStatus.rows[0]});
        
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Reservation status update error:", error);
        }
        res.status(500).json({ message: "Server error"});
    }
};

const getTicket = async (req, res) => {
    try {
        // OPTIMIZATION: Added pagination support
        const page = parseInt(req.query.page) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 1000;
        const offset = (page - 1) * limit;

        const [ticketsQuery, countQuery] = await Promise.all([
            pool.query(`
                SELECT 
                    t.id, 
                    t.station_id,
                    t.subject,
                    t.description AS issue,
                    t.status, 
                    t.created_at,
                    u.username
                FROM tickets t
                JOIN users u ON t.user_id = u.id
                ORDER BY t.created_at DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]),
            pool.query('SELECT COUNT(*) FROM tickets')
        ]);

        res.status(200).json({ 
            tickets: ticketsQuery.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countQuery.rows[0].count),
                pages: Math.ceil(parseInt(countQuery.rows[0].count) / limit)
            }
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Ticket fetch error:", error);
        }
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
        if (process.env.NODE_ENV === 'development') {
            console.error("Ticket status update error:", error);
        }
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
        if (process.env.NODE_ENV === 'development') {
            console.error("Reservation deletion error:", error);
        }
        res.status(500).json({ message: "Server error"});
    }
};

const getComputers = async (req, res) => {
    try {
        const computers = await pool.query(`SELECT * FROM computers ORDER BY id ASC`);
        res.status(200).json({ computers: computers.rows });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Computer fetch error:", error);
        }
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
        if (process.env.NODE_ENV === 'development') {
            console.error("Computer status update error:", error);
        }
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
