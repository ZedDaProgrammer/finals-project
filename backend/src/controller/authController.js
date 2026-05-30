
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
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
}

//register
const userRegister = async (req, res) => {
    const { username, email, password } = req.body;
    //checks if all details are inputted
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'provide all the details that are required' });
    }

    // SECURITY OPTIMIZATION: Enforce minimum password length to prevent weak account credentials.
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    try {
        const emailLower = email.toLowerCase().trim();
        //checks if user exist in the database
        const userExist = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [emailLower]);

        //returns an error message if user exists
        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'This user exist already' });
        }

        //password hashing 
        const hashedPassword = await bcrypt.hash(password, 10);

        //Registers user in the database with the hashed password
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, emailLower, hashedPassword]
        );

        const token = generateToken(newUser.rows[0].id);

        res.cookie('token', token, cookieOptions);

        const user = { ...newUser.rows[0] };
        delete user.password;

        return res.status(201).json({ user });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Register Error:", error);
        }
        return res.status(500).json({ message: "Server error during registration" });
    }
};

//Login 

const userLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Provide all required fields' });
    }

    try {
        const emailLower = email.toLowerCase().trim();
        const user = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [emailLower]);

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const userData = user.rows[0];

        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const token = generateToken(userData.id);

        res.cookie('token', token, cookieOptions);

        res.json({
            token: token,
            user: { id: userData.id, username: userData.username, email: userData.email }
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Login Error:", error);
        }
        return res.status(500).json({ message: "Server error during login" });
    }
};

//profile
const userProfile = async (req, res) => {
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
    
    // SECURITY BUG FIX: Block empty or null field updates which would corrupt user profile records.
    if (!username || !email || !username.trim() || !email.trim()) {
        return res.status(400).json({ message: "Username and email cannot be empty." });
    }
    
    try {
        await pool.query('UPDATE users SET username = $1, email = $2 WHERE id = $3', [username, email, req.user.id]);
        res.status(200).json({ message: "Profile updated" });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ message: "Username or email is already taken." });
        }
        res.status(500).json({ message: "Server error" });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // SECURITY OPTIMIZATION: Enforce minimum password length on change-password requests.
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }
    
    try {
        const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
        res.status(200).json({ message: "Password updated" });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
};

// OPTIMIZATION #2: Added maximum credit cap to prevent abuse
const MAX_CREDIT_TOPUP = 1000;

const addCredits = async (req, res) => {
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
    }
    if (amount > MAX_CREDIT_TOPUP) {
        return res.status(400).json({ message: `Maximum top-up amount is ${MAX_CREDIT_TOPUP} credits` });
    }
    try {
        await pool.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, req.user.id]);
        res.status(200).json({ message: "Credits added" });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
};

// OPTIMIZATION #1: Added rate-limiting via database tracking to prevent brute-force password resets
const FORGOT_PASSWORD_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FORGOT_ATTEMPTS = 5;
const forgotPasswordAttempts = new Map(); // In-memory store (use Redis in production)

const forgotPassword = async (req, res) => {
    const { email, username, newPassword } = req.body;
    if (!email || !username || !newPassword) {
        return res.status(400).json({ message: 'Provide email, username, and new password' });
    }

    // SECURITY OPTIMIZATION: Enforce minimum password length on forgot-password resets.
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    // Rate-limit check
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const attempts = forgotPasswordAttempts.get(clientIP) || [];
    const recentAttempts = attempts.filter(ts => now - ts < FORGOT_PASSWORD_WINDOW_MS);
    
    if (recentAttempts.length >= MAX_FORGOT_ATTEMPTS) {
        return res.status(429).json({ message: 'Too many password reset attempts. Please try again later.' });
    }
    
    recentAttempts.push(now);
    forgotPasswordAttempts.set(clientIP, recentAttempts);

    try {
        const emailLower = email.toLowerCase().trim();
        const usernameLower = username.toLowerCase().trim();

        // Verify if a user with both email and username exists
        const user = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = $1 AND LOWER(username) = $2',
            [emailLower, usernameLower]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid email or username combination' });
        }

        const userId = user.rows[0].id;

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        return res.status(200).json({ message: 'Password reset successful. Please sign in.' });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Forgot Password Error:", error);
        }
        return res.status(500).json({ message: "Server error during password reset" });
    }
};

module.exports = { userRegister, userLogin, userProfile, userLogout, updateProfile, changePassword, addCredits, forgotPassword };