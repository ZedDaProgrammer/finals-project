const express = require('express');
const router = express.Router();
const { token, isAdmin } = require('../middleware/authMiddleware');
const { getBookings, updateReservationStatus, getTicket, updateTicketStatus } = require('../controller/adminController');

router.get('/bookings', token, isAdmin, getBookings);
router.put('/bookings/:id/status', token, isAdmin, updateReservationStatus);
router.get('/tickets', token, isAdmin, getTicket);
router.put('/tickets/:id/status', token, isAdmin, updateTicketStatus);

module.exports = router;