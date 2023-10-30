require("dotenv").config();
const pgp = require("pg-promise")();
const connectionDetails = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};
const db = pgp(connectionDetails);

module.exports = db;
