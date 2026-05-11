const express = require('express');
const router = express.Router();
const { token } = require('../middleware/authMiddleware');
const { userRegister, userLogin, userProfile, userLogout } = require('../controller/authController');

router.post('/register', userRegister);
router.post('/login', userLogin);
router.get('/profile', token, userProfile);
router.post('/logout', userLogout);

module.exports = router;