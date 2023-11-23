const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT;

// Routers
const productsRouter = require("./routes/products");
const registerRouter = require("./routes/register-login");
const userLoginRouter = require("./routes/user-login");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Connected");
});

app.use("/api/products", productsRouter);
app.use("/api/auth", registerRouter);
app.use("/api/user", userLoginRouter);

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Example app listening on port ${port}`);
});
