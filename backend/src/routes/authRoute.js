const express = require('express');
const router = express.Router();
const { token } = require('../middleware/authMiddleware');
const { userRegister, userLogin, userProfile, userLogout } = require('../controller/authController');

router.post('/register', userRegister);
router.post('/login',token, userLogin);
router.get('/profile', userProfile);
router.post('/logout', userLogout);

module.exports = router;