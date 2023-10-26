const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
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

app.get("/", (req, res) => {
  db.any("SELECT * FROM attractions")
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred" });
    });
});

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Example app listening on port ${port}`);
});
