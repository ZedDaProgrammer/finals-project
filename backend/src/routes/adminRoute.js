const express = require('express');
const router = express.Router();
const { token, isAdmin } = require('../middleware/authMiddleware');

const { getBookings, updateReservationStatus, getTicket, updateTicketStatus, deleteReservation, getComputers, updateComputerStatus, getAnalytics } = require('../controller/adminController');

router.get('/bookings', token, isAdmin, getBookings);
router.put('/bookings/:id/status', token, isAdmin, updateReservationStatus);
router.delete('/bookings/:id', token, isAdmin, deleteReservation);
router.get('/tickets', token, isAdmin, getTicket);
router.put('/tickets/:id/status', token, isAdmin, updateTicketStatus);
router.get('/computers', token, isAdmin, getComputers);
router.put('/computers/:id/status', token, isAdmin, updateComputerStatus);
router.get('/analytics', token, isAdmin, getAnalytics);

module.exports = router;