require('dotenv').config();
const pool = require('./src/database/db');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const authRouter = require('./src/routes/authRoute');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authReservation = require('./src/routes/reservationRoute');
const adminRouter = require('./src/routes/adminRoute');

const allowedOrigins = ['http://localhost:5173', 'https://finals-project-xi.vercel.app'];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/reservation', authReservation);
app.use('/api/admin', adminRouter);

app.get('/', async (req, res) =>{
    if (process.env.NODE_ENV === 'development') {
        console.log("Server health check: Starting database query");
    }
    try {
        const result = await pool.query("SELECT current_database()");
        res.send(`The database name is ${result.rows[0].current_database}`);
    } catch (error) {
        console.error("Database connection error:", error.message);
        res.status(500).json({ error: "Database connection failed" });
    }
});

// OPTIMIZATION #19: Global error handler to catch unhandled errors
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error('Unhandled error:', err.stack);
    }
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
