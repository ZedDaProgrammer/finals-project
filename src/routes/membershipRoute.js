const express = require('express');
const router = express.Router();
const { token, isAdmin } = require('../middleware/authMiddleware');
const pool = require('../database/db');

router.use(token);
router.use(isAdmin);

const evaluatePoints = (points) => {
    if(points >= 100) return 'radiant';
    if(points >= 60) return 'platinum';
    if(points >= 30) return 'gold';
    if(points >= 10) return 'silver';
    return 'bronze';
}

const upgradeBronze = async (req, res) => {
    try{
        const upgradeQuery = await pool.query(
            `UPDATE users SET membership = 'silver' WHERE id = $1 RETURNING *`,
            [req.user.id]
        );
        if(upgradeQuery.rows.length === 0){
            return res.status(404).json({ message: "User not found"});
        }
        return upgradeQuery.rows[0];
    } catch (error) {
        console.error("Database error during upgrade", error.message);
        throw err;or;
    }
};

router.post('/purchase', async (req, res) => {
    try {
        const success = true;
        if(success){
            const upgradedUser = await upgradeBronze(req, res);
            return res.status(200).json({ message: "Membership upgraded to Silver", user: upgradedUser});
        } else {
            return res.status(400).json({ message: "Payment failed, upgrade unsuccessful"});
        }
    } catch (error) {
        res.status(500).json({ message: "Server error during upgrade"});
    }
});