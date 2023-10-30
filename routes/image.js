const express = require("express");
const router = express.Router();
require("dotenv").config();
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const db = require("../database");

const currentTime = new Date();
const timeStamp = new Date().getTime();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccess_key = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccess_key,
  },
});

// generate image name
const imageName = `${currentTime.getFullYear()}${
  currentTime.getMonth() + 1
}${currentTime.getDate()}_${currentTime.getHours()}${currentTime.getMinutes()}${currentTime.getSeconds()}_${timeStamp}`;

// get all names
router.get("/", async (req, res) => {
  db.any("SELECT * FROM attractions")
    .then((data) => {
      console.log("data : ", data.length);
      res.json(data);
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred" });
    });
  // const getObjectParams = {
  //   Bucket: bucketName,
  //   Key: "data.image",
  // };
  // const command = new GetObjectCommand(getObjectParams);
  // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  // data.image = url;
});

// get one name by id
router.get("/:id", async (req, res) => {
  db.any("SELECT * FROM attractions where id = $1", req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred" });
    });
});

router.post("/api/upload", upload.single("image"), async (req, res) => {
  console.log("req.file : ", req.file);
  // resize
  const buffer = await sharp(req.file.buffer)
    .resize({ width: 1920, height: 1080, fit: "contain" })
    .toBuffer();

  // upload to s3
  const params = {
    Bucket: bucketName,
    Body: buffer,
    Key: imageName,
    ContentType: req.file.mimetype,
  };
  const command = new PutObjectCommand(params);
  const dataFromS3 = await s3.send(command);
  console.log("dataFromS3 : ", dataFromS3);

  // add to database
  db.any("INSERT INTO attractions (name, image) VALUES ($1, $2)", [
    req.body.name,
    imageName,
  ]);

  // db.any("INSERT INTO attractions (name) VALUES ($1)", [req.body.name])
  //   .then((data) => {
  //     res.json(data);
  //   })
  //   .catch((error) => {
  //     console.error("Error:", error);
  //     res.status(500).json({ error: "An error occurred" });
  //   });

  res.send("/api/upload : ok");
});

router.get("/api/getImage", (req, res) => {
  res.send("/api/getImage : ok");
});

module.exports = router;
