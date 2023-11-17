const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const secret = process.env.JWT_SECRET;
require("dotenv").config();
const db = require("../database");

const decodeJWT = (token) => {
  return jwt.verify(token, secret);
};

router.post("/login", async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;
  try {
    const hadUser = await db.any("SELECT * FROM accounts WHERE username = $1", [
      username,
    ]);
    if (hadUser.length == 0) {
      return res.json({ status: "user_not_found", message: "user not found" });
    }
    bcrypt.compare(password, hadUser[0].password, (err, isLogin) => {
      if (isLogin) {
        const token = jwt.sign(
          {
            id: hadUser[0].id,
            email: hadUser[0].email,
            account_type: hadUser[0].account_type,
          },
          secret,
          {
            expiresIn: "1h",
          }
        );
        res
          .status(200)
          .json({ status: "success", message: "Login success", token });
      } else {
        res
          .status(401)
          .json({ status: "password_error", message: "password incorrect" });
      }
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500).json({ error: "An error occurred" });
  }
});

router.post("/authenticate", async (req, res) => {
  try {
    const decoded = decodeJWT(req.headers.authorization.split(" ")[1]);
    const dataUser = await db.any("SELECT * FROM accounts WHERE email = $1", [
      decoded.email,
    ]);
    res.json({ status: "ok", message: dataUser[0].username });
  } catch (error) {
    res.json({ status: "error", message: "token expired" });
  }
});

module.exports = router;
