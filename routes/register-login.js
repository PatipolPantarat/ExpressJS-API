const express = require("express");
const router = express.Router();
require("dotenv").config();
const db = require("../database");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

router.get("/alluser", async (req, res) => {
  const allUser = await db.any("SELECT * FROM users");
  res.json(allUser);
});

router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  const hadUser = await db.any("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
  if (hadUser.length > 0) {
    return res.json({ status: "error", message: "username already exists" });
  }
  bcrypt.hash(password, saltRounds, async (err, hash) => {
    await db.any(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
      [username, hash, role]
    );
  });
  res.json({ status: "success", message: "register success" });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const dataUser = await db.any("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (dataUser.length == 0) {
      return res.json({ status: "error", message: "user not found" });
    }
    bcrypt.compare(password, dataUser[0].password, (err, isLogin) => {
      if (err) {
        res.json({ status: "error", message: err });
      }
      if (isLogin) {
        const token = jwt.sign(
          { username: dataUser[0].username, role: dataUser[0].role },
          secret,
          {
            expiresIn: "1h",
          }
        );
        res.json({
          status: "success",
          message: "login success",
          token,
        });
      } else {
        res.json({ status: "error", message: "password incorrect" });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/authen", (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secret);
    res.json({ status: "ok", message: decoded });
  } catch (error) {
    res.json({ status: "error", message: error.message });
  }
});

module.exports = router;
