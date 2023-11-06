const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// routers
const productsRouter = require("./routes/products");
const registerRouter = require("./routes/register-login");

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use("/api/products", productsRouter);
app.use("/api/auth", registerRouter);

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Example app listening on port ${port}`);
});
