const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

const imageRouter = require("./routes/image");
const attractionsRouter = require("./routes/attractions");

app.use(cors());

app.use("/", imageRouter);
app.use("/name", attractionsRouter);

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Example app listening on port ${port}`);
});
