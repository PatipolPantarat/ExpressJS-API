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

const imageName_test = "kafka.jpg";

// get all names
router.get("/", async (req, res) => {
  db.any("SELECT * FROM attractions")
    .then((data) => {
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

  // const params = {
  //   Bucket: bucketName,
  //   Key: imageName,
  // };
  // const command = new GetObjectCommand(params);
  // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  // console.log("url : ", url);
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

  // generate image name
  const imageName = `${currentTime.getFullYear()}${
    currentTime.getMonth() + 1
  }${currentTime.getDate()}_${currentTime.getHours()}${currentTime.getMinutes()}${currentTime.getSeconds()}_${timeStamp}_${
    req.file.originalname
  }`;

  // resize image
  const buffer = await sharp(req.file.buffer)
    .resize({ width: 1920, height: 1080, fit: "contain" })
    .toBuffer();

  // upload to s3
  const paramsPut = {
    Bucket: bucketName,
    Body: buffer,
    Key: imageName,
    ContentType: req.file.mimetype,
  };
  const commandPut = new PutObjectCommand(paramsPut);
  const dataFromS3 = await s3.send(commandPut);
  console.log("dataFromS3 : ", dataFromS3);

  // generate url
  const paramsGet = {
    Bucket: bucketName,
    Key: imageName,
  };
  const commandGet = new GetObjectCommand(paramsGet);
  const url = await getSignedUrl(s3, commandGet);
  console.log("url : ", url);

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
