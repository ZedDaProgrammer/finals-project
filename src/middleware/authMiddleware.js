const pool = require('../database/db');
const jwt = require('jsonwebtoken');

const token = async (req, res, next) => {
    try {
        
        const token = req.cookies.token;
        if(!token){
            return res.status(401).json({ message: "Not authorized, No token"});
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await pool.query('SELECT id, username, email FROM users WHERE id = $1',
            [decoded.id]
        )

        if(user.rows.length === 0){
            return res.status(401).json({ message: "Not authorized, User not found"});
        }

        req.user = user.rows[0];
        next();

    } catch (error){
        console.error(error);
        res.status(401).json({ message: "Not autorized token"});
    }
}

const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await pool.query('SELECT is_admin FROM users WHERE id = $1', 
        [userId]);

        if(user.rows.length === 0 || !user.rows[0].is_admin){
            return res.status(403).json({ message: "Forbidden, Admins only"});
        }
        next();
} catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error"});
}
};

module.exports = { token, isAdmin };