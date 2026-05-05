
require('dotenv').config();
const { Pool } = require('pg');

//linking database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on("connect", () => {
    console.log("Connection pool established with database")
    
});

module.exports = pool;