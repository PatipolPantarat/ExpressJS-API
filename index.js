const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

const pgp = require("pg-promise")();
const db = pgp(process.env.DATABASE_URL);

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
