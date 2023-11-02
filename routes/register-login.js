const express = require("express");
const router = express.Router();
require("dotenv").config();
const db = require("../database");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

router.get("/alluser", async (req, res) => {
  const allUser = await db.any("SELECT * FROM accounts");
  res.json(allUser);
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hadUser = await db.any(
    "SELECT * FROM accounts WHERE username = $1 AND is_deleted = $2",
    [username, false]
  );
  const hadEmail = await db.any(
    "SELECT * FROM accounts WHERE email = $1 AND is_deleted = $2",
    [email, false]
  );
  if (hadUser.length > 0) {
    return res.json({ status: "error", message: "username already exists" });
  }
  if (hadEmail.length > 0) {
    return res.json({ status: "error", message: "email already exists" });
  }
  bcrypt.hash(password, saltRounds, async (err, hash) => {
    await db.any(
      "INSERT INTO accounts (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
      [username, email, hash, new Date(), new Date()]
    );
  });
  res.json({ status: "success", message: "register success" });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const dataUser = await db.any(
      "SELECT * FROM accounts WHERE username = $1 AND is_deleted = false",
      [username]
    );
    if (dataUser.length == 0) {
      return res.json({ status: "user_not_found", message: "user not found" });
    }
    if (dataUser[0].account_type != "admin") {
      return res.json({
        status: "user_not_allow",
        message: "this user not allow",
      });
    }
    bcrypt.compare(password, dataUser[0].password, (err, isLogin) => {
      if (err) {
        res.json({ status: "error", message: err });
      }
      if (isLogin) {
        const token = jwt.sign(
          {
            username: dataUser[0].username,
            account_type: dataUser[0].account_type,
          },
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
        res.json({ status: "password_error", message: "password incorrect" });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/authenticate", (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secret);
    res.json({ status: "ok", message: decoded });
  } catch (error) {
    res.json({ status: "error", message: error.message });
  }
});

module.exports = router;
