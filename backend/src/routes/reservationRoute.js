const express = require('express');
const router = express.Router();
const { token } = require('../middleware/authMiddleware');
router.use(token);

const { checkAvailability, createBooking, getHistory, deleteBooking, filterComputers, upgradeMembership, groupBooking, createTicket, dashboardData, getDashboardStats } = require('../controller/reservationController');

router.get('/stats', getDashboardStats);
router.get('/dashboard', dashboardData);
router.get('/check', checkAvailability);
router.post('/book', createBooking);
router.get('/history', getHistory);
router.delete('/cancel/:id', deleteBooking);
router.post('/filter', filterComputers);
router.post('/purchase', upgradeMembership);
router.post('/group-booking', groupBooking);
router.post('/post', createTicket);

module.exports = router;
