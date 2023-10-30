const express = require("express");
const router = express.Router();
require("dotenv").config();

const db = require("../database");
// get all names
router.get("/", (req, res) => {
  db.any("SELECT name FROM attractions")
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred" });
    });
});

// get one name by id
router.get("/:id", (req, res) => {
  db.any("SELECT name FROM attractions where id = $1", req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred" });
    });
});

router.post("/", (req, res) => {
  console.log("req.body", req.body);
  res.send("ok");
  // db.any("INSERT INTO attractions (name) VALUES ($1)", [req.body.name])
  //   .then((data) => {
  //     res.json(data);
  //   })
  //   .catch((error) => {
  //     console.error("Error:", error);
  //     res.status(500).json({ error: "An error occurred" });
  //   });
});

module.exports = router;
