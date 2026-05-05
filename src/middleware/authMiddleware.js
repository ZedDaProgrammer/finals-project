const pool = require('../database/db');
const jwt = require('jsonwebtoken');

const token = async (req, res) => {
    try {
        const token = req.cookies.token;
        if(!token){
            return res.status(401).json({ message: "Not authorized no token"});
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await pool.query('SELECT id, username, email FROM users WHERE id = $1',
            [decoded.id]
        )

        if(user.rows.length === 0){
            return res.status(401).json({ message: "Not authorized, user not fucking found"});
        }

        req.user = user.rows[0];
        next();

    } catch (error){
        console.error(error);
        res.status(401).json({ message: "Not autorized token"});
    }
}

module.exports = token;