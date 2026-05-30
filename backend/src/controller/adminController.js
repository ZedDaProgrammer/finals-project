const pool = require('../database/db');

const getBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
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
            station_id: b.station_id,
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
        res.status(500).json({ message: "Server error" });
    }
};

const updateReservationStatus = async (req, res) => {
    const id = req.params.id;

    const { status, start, end } = req.body;

    const allowedStatuses = ['pending', 'active', 'completed', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    try {
        let query = `UPDATE reservations SET status = $1 WHERE reservation_id = $2 RETURNING *`;
        let values = [status, id];

        // Save the exact local times the frontend sent us!
        if (status === 'active' && start && end) {
            if (isNaN(Date.parse(start)) || isNaN(Date.parse(end)) || new Date(start) >= new Date(end)) {
                return res.status(400).json({ message: "Invalid start or end date." });
            }

            const bookingQuery = await pool.query('SELECT station_id FROM reservations WHERE reservation_id = $1', [id]);
            if (bookingQuery.rows.length === 0) {
                return res.status(404).json({ message: "Reservation not found" });
            }
            const station_id = bookingQuery.rows[0].station_id;

            const overlapping = await pool.query(`
                SELECT 1 FROM reservations
                WHERE station_id = $1
                AND reservation_id != $2
                AND status != 'cancelled'
                AND start < $4::timestamp
                AND "end" > $3::timestamp
                LIMIT 1
            `, [station_id, id, start, end]);

            if (overlapping.rows.length > 0) {
                return res.status(400).json({ message: "This station is already booked during the selected time slot." });
            }

            query = `
                UPDATE reservations 
                SET status = $1, start = $3, "end" = $4
                WHERE reservation_id = $2 
                RETURNING *
            `;
            values = [status, id, start, end];
        }

        const updateStatus = await pool.query(query, values);

        if (updateStatus.rows.length === 0) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        res.status(200).json({ message: "Status updated successfully", reservation: updateStatus.rows[0] });

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Reservation status update error:", error);
        }
        res.status(500).json({ message: "Server error" });
    }
};

const getTicket = async (req, res) => {
    try {
        // OPTIMIZATION: Added pagination support
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
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
        res.status(500).json({ message: "Server error" });
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
            return res.status(404).json({ message: "Ticket not found" });
        }

        res.status(200).json({
            message: "Ticket status updated successfully", ticket: updateTicket.rows[0]
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Ticket status update error:", error);
        }
        res.status(500).json({ message: "Server error" });
    }
};

const deleteReservation = async (req, res) => {
    const id = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // LOGICAL BUG FIX: Lock the reservation and fetch PC rate details before deletion.
        // Previously, raw DELETE simply deleted the database row without any credit refund or points revocation, 
        // leaving the user with lost credits and unearned points.
        const checkQuery = await client.query(
            `SELECT r.*, c.pc_rate FROM reservations r
             JOIN computers c ON r.station_id = c.id
             WHERE r.reservation_id = $1
             FOR UPDATE`, [id]
        );

        if (checkQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Reservation not found" });
        }

        const booking = checkQuery.rows[0];

        // Refund is only applicable for future/upcoming non-cancelled reservations
        if (booking.status !== 'cancelled' && new Date(booking.start) > new Date()) {
            const startTime = new Date(booking.start);
            const endTime = new Date(booking.end);
            const durationHours = Math.max(1, Math.ceil(Math.abs(endTime - startTime) / 36e5));
            const originalCost = (booking.pc_rate || 0) * durationHours;

            // Lock and fetch user points before recalculating their discount tier
            const userQuery = await client.query('SELECT points FROM users WHERE id = $1 FOR UPDATE', [booking.user_id]);
            if (userQuery.rows.length > 0) {
                const currentPoints = userQuery.rows[0].points || 0;
                const earnedPoints = durationHours;
                const pointsBeforeBooking = Math.max(0, currentPoints - earnedPoints);

                // Import helper directly to calculate the refund amount correctly
                const { getDiscountTier } = require('./utils/discountHelper');
                const { rate: discountRate } = getDiscountTier(pointsBeforeBooking);
                const refundAmount = Math.round(originalCost * (1 - discountRate));

                // Refund the user and revoke points (with a floor of 0)
                await client.query(
                    `UPDATE users 
                     SET credits = credits + $1, points = GREATEST(0, points - $2) 
                     WHERE id = $3`,
                    [refundAmount, earnedPoints, booking.user_id]
                );
            }
        }

        await client.query(`DELETE FROM reservations WHERE reservation_id = $1`, [id]);
        await client.query('COMMIT');
        res.status(200).json({ message: "Reservation deleted and user refunded successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        if (process.env.NODE_ENV === 'development') {
            console.error("Reservation deletion error:", error);
        }
        res.status(500).json({ message: "Server error during reservation deletion" });
    } finally {
        client.release();
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
        res.status(500).json({ message: "Server error" });
    }
};

const updateComputerStatus = async (req, res) => {
    const id = req.params.id;
    const { availability } = req.body;

    const allowedAvailabilities = ['available', 'maintenance'];
    if (!allowedAvailabilities.includes(availability)) {
        return res.status(400).json({ message: "Invalid availability value" });
    }

    try {
        const updateStatus = await pool.query(
            `UPDATE computers SET availability = $1 WHERE id = $2 RETURNING *`,
            [availability, id]
        );
        if (updateStatus.rows.length === 0) {
            return res.status(404).json({ message: "Computer not found" });
        }
        res.status(200).json({ message: "Status updated successfully", computer: updateStatus.rows[0] });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Computer status update error:", error);
        }
        res.status(500).json({ message: "Server error" });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const [hourStats, zoneStats, ticketStats, computerStats] = await Promise.all([
            pool.query(`
                SELECT EXTRACT(HOUR FROM start) AS hour, COUNT(*) AS count
                FROM reservations
                GROUP BY hour
                ORDER BY hour ASC
            `),
            pool.query(`
                SELECT c.type, COUNT(*) AS count
                FROM reservations r
                JOIN computers c ON r.station_id = c.id
                GROUP BY c.type
            `),
            pool.query(`
                SELECT status, COUNT(*) AS count
                FROM tickets
                GROUP BY status
            `),
            pool.query(`
                SELECT availability, COUNT(*) AS count
                FROM computers
                GROUP BY availability
            `)
        ]);

        res.status(200).json({
            hours: hourStats.rows.map(r => ({ hour: parseInt(r.hour), count: parseInt(r.count) })),
            zones: zoneStats.rows.map(r => ({ type: r.type, count: parseInt(r.count) })),
            tickets: ticketStats.rows.map(r => ({ status: r.status, count: parseInt(r.count) })),
            computers: computerStats.rows.map(r => ({ availability: r.availability, count: parseInt(r.count) }))
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Database error in getAnalytics:", error);
        }
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getBookings,
    updateReservationStatus,
    getTicket,
    updateTicketStatus,
    deleteReservation,
    getComputers,
    updateComputerStatus,
    getAnalytics
};
