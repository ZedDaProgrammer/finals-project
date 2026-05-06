const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');
const router = express.Router();
const protect = require('../middleware/authMiddleware');


//token and cookies
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000
}

//generates token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
}

//register
router.post('/register', async(req, res) => {
    const { username, email, password } = req.body;
    //checks if all details are inputted
    if(!username || !email || !password){
        return res.status(400).json({message: 'provide all the details that are required'});
    }

    //checks if user exist in the database
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    //returns an error message if user exists
    if(userExist.rows.length > 0){
        return res.status(400).json({message: 'This nigga exist already'});
    }
    
    //password hashing 
    const hashedPassword = await bcrypt.hash(password, 10);

    //Registers user in the database with the hashed password
    const newUser = await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        [username, email, hashedPassword]
    );

    const token = generateToken(newUser.rows[0].id);
    
    res.cookie('token', token, cookieOptions);

    return res.status(201).json({ user: newUser.rows[0] });
})

//Login 

router.post('/login', async (req, res) =>{
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Provinigga all required fields'});
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
        return res.status(400).json({ message: 'Iniggavalid Credentials'});
    }

    const userData = user.rows[0];

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
        return res.status(400).json({ message: 'Iniggavalid Credentials'});
    }

    const token = generateToken(userData.id);

    res.cookie('token', token, cookieOptions);

    res.json( {user: { id: userData.id, username: userData.username, email: userData.email} });
});

//profile
router.get('/profile', protect, async (req, res) => {
    res.json(req.user);
});

router.post('/logout', (req, res) => {
    res.cookieOptions("auth_token", "", {
        expires: new Date(0),
    });
});

module.exports = router;