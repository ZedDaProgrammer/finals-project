require('dotenv').config();
const pool = require('./src/database/db');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const authRouter = require('./src/routes/authRoute');
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(cookieParser());
app.use('/src/authRoute', authRouter);

app.get('/', async (req, res) =>{
    console.log("Start");
    const result = await pool.query("SELECT current_database()");
    console.log("End");
    res.send(`The database name is ${result.rows[0].current_database}`);
});


app.listen(PORT, () => {
    console.log(`Server is madafaking running ${PORT}`);
});
