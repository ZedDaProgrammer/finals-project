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

// Updated to use /api/
app.use('/api/auth', authRouter);
app.use('/api/reservation', authReservation);
app.use('/api/admin', adminRouter);

app.get('/', async (req, res) =>{
    console.log("Start");
    const result = await pool.query("SELECT current_database()");
    console.log("End");
    res.send(`The database name is ${result.rows[0].current_database}`);
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});

module.exports = app;