require('dotenv').config();
const pg = require('pg');

// OID 1114 is for TIMESTAMP WITHOUT TIME ZONE
pg.types.setTypeParser(1114, (stringValue) => {
    return new Date(stringValue.replace(' ', 'T') + 'Z');
});

const { Pool } = pg;

const poolConfig = {
    connectionString: process.env.DATABASE_URL
};

if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
    console.log("Connection pool established with database");
});

pool.on("error", (err) => {
    console.error("Unexpected database error:", err.message);
});

module.exports = pool;