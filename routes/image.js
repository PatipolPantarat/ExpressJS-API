const express = require("express");
const router = express.Router();
require("dotenv").config();
const db = require("../database");

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

// get all names
router.get("/api/name", async (req, res) => {
  db.any("SELECT * FROM attractions")
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred" });
    });
});

// get one name by id
router.get("/api/name/:id", async (req, res) => {
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
  // generate image name
  const imageName = `${currentTime.getFullYear()}${
    currentTime.getMonth() + 1
  }${currentTime.getDate()}_${currentTime.getHours()}${currentTime.getMinutes()}${currentTime.getSeconds()}_${timeStamp}_${
    req.file.originalname
  }`;

  // resize image
  const buffer = await sharp(req.file.buffer)
    .resize({ width: 500, height: 500, fit: "contain" })
    .toBuffer();

  // upload to s3
  const paramsPut = {
    Bucket: bucketName,
    Body: buffer,
    Key: imageName,
    ContentType: req.file.mimetype,
  };
  const commandPut = new PutObjectCommand(paramsPut);
  await s3.send(commandPut);

  // generate url
  const expiration = 604800;
  const paramsGet = {
    Bucket: bucketName,
    Key: imageName,
  };
  const commandGet = new GetObjectCommand(paramsGet);
  const url = await getSignedUrl(s3, commandGet, { expiresIn: expiration });

  // put data to postgresql
  db.any("INSERT INTO attractions (name, image) VALUES ($1, $2)", [
    req.body.name,
    url,
  ]);

  res.send("/api/upload : ok");
});

router.get("/api/getImage", (req, res) => {
  res.send("/api/getImage : ok");
});

module.exports = router;
