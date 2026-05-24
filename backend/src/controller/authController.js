
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');



//token and cookies
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
}

//generates token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
}

//register
const userRegister = async(req, res) => {
    const { username, email, password } = req.body;
    //checks if all details are inputted
    if(!username || !email || !password){
        return res.status(400).json({message: 'provide all the details that are required'});
    }

    //checks if user exist in the database
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    //returns an error message if user exists
    if(userExist.rows.length > 0){
        return res.status(400).json({message: 'This user exist already'});
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
};

//Login 

const userLogin = async (req, res) =>{
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Provide all required fields'});
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid Credentials'});
    }

    const userData = user.rows[0];

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid Credentials'});
    }

    const token = generateToken(userData.id);

    res.cookie('token', token, cookieOptions);

    res.json({
        token: token,
        user: { id: userData.id, username: userData.username, email: userData.email} 
    });
};

//profile
const userProfile =  async (req, res) => {
    res.json(req.user);
};

const userLogout = async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ message: "Logged out successfully" });
};

const updateProfile = async (req, res) => {
    const { username, email } = req.body;
    try {
        await pool.query('UPDATE users SET username = $1, email = $2 WHERE id = $3', [username, email, req.user.id]);
        res.status(200).json({ message: "Profile updated" });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
        res.status(200).json({ message: "Password updated" });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
};

const addCredits = async (req, res) => {
    const { amount } = req.body;
    try {
        await pool.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, req.user.id]);
        res.status(200).json({ message: "Credits added" });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
};



module.exports = { userRegister, userLogin, userProfile, userLogout, updateProfile, changePassword, addCredits };