
require('dotenv').config();
const { Pool } = require('pg');

//linking database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on("connect", () => {
    console.log("Connection pool established with database")
    
});

pool.on("error", (err) => {
    console.error("Unexpected database error:", err.message);
});

module.exports = pool;