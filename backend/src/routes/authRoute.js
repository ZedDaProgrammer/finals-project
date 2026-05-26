const express = require('express');
const router = express.Router();
const { token } = require('../middleware/authMiddleware');
const { userRegister, userLogin, userProfile, userLogout, updateProfile, changePassword, addCredits, forgotPassword } = require('../controller/authController');

router.post('/register', userRegister);
router.post('/login', userLogin);
router.post('/forgot-password', forgotPassword);
router.get('/profile', token, userProfile);
router.post('/logout', userLogout);
router.put('/update-profile', token, updateProfile);
router.put('/change-password', token, changePassword);
router.post('/add-credits', token, addCredits);
module.exports = router;