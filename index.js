const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT;

// routers
const productsRouter = require("./routes/products");
const registerRouter = require("./routes/register-login");
const userLoginRouter = require("./routes/user-login");

// const whitelist = [
//   "https://q4pq8xww-3000.asse.devtunnels.ms/",
//   "http://127.0.0.1:5500",
// ];
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
// };

app.use(cors());
app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/auth", registerRouter);
app.use("/api/user", userLoginRouter);

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Example app listening on port ${port}`);
});
