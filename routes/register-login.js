const express = require("express");
const router = express.Router();
require("dotenv").config();
const db = require("../database");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const decodeJWT = (token) => {
  return jwt.verify(token, secret);
};

router.get("/alluser", async (req, res) => {
  const allUser = await db.any(
    "SELECT * FROM accounts where is_deleted = false"
  );
  res.json(allUser);
});

router.post("/find_account", async (req, res) => {
  const username = req.body.isUserLogin;
  const hadUser = await db.any("SELECT * FROM accounts WHERE username = $1", [
    username,
  ]);
  res.json({
    status: "success",
    message: hadUser[0],
  });
});

router.post("/add_account", async (req, res) => {
  const { username, email, password, account_type } = req.body;
  const hadUser = await db.any("SELECT * FROM accounts WHERE username = $1", [
    username,
  ]);
  const hadEmail = await db.any("SELECT * FROM accounts WHERE email = $1", [
    email,
  ]);
  if (hadUser.length > 0) {
    if (hadUser[0].is_deleted == true) {
      return res.json({ status: "error", message: "user is soft_deleted" });
    }
    return res.json({ status: "error", message: "username already exists" });
  }
  if (hadEmail.length > 0) {
    return res.json({ status: "error", message: "email already exists" });
  }
  bcrypt.hash(password, saltRounds, async (err, hash) => {
    await db.any(
      "INSERT INTO accounts (username, email, password, account_type, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [username, email, hash, account_type, new Date(), new Date()]
    );
  });
  res.json({ status: "success", message: "add account success" });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const dataUser = await db.any(
      "SELECT * FROM accounts WHERE username = $1",
      [username]
    );

    if (dataUser.length == 0 || dataUser[0].is_deleted == true) {
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
            id: dataUser[0].id,
            email: dataUser[0].email,
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

// Soft Delete
// router.post("/delete", async (req, res) => {
//   try {
//     const { selectedIDs } = req.body;
//     await db.any("UPDATE accounts SET is_deleted = true WHERE id = ANY($1)", [
//       selectedIDs,
//     ]);
//     res.status(200).json({ status: "success", message: "delete success" });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "An error occurred" });
//   }
// });

// Hard Delete
router.delete("/delete", async (req, res) => {
  try {
    const { selectedIDs } = req.body;
    selectedIDs.forEach(async (id) => {
      await db.any("DELETE FROM accounts WHERE id = $1", [id]);
    });

    res
      .status(200)
      .json({ status: "success", message: "Data deleted successfully" });
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/update", async (req, res) => {
  const { oldUsername, newUsername, newPassword } = req.body;
  const hadUser = await db.any("SELECT * FROM accounts WHERE username = $1", [
    newUsername,
  ]);
  if (hadUser.length > 0) {
    return res.json({ status: "error", message: "username already exists" });
  }
  if (newPassword == "") {
    await db.any(
      "UPDATE accounts SET username = $1, updated_at = $2 WHERE username = $3",
      [newUsername, new Date(), oldUsername]
    );
  } else {
    bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
      await db.any(
        "UPDATE accounts SET username = $1, password = $2, updated_at = $3 WHERE username = $4",
        [newUsername, hash, new Date(), oldUsername]
      );
    });
  }
  res.json({ status: "success", message: "update success" });
});

module.exports = router;
