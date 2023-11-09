const express = require("express");
const router = express.Router();
require("dotenv").config();
const db = require("../database");
const multer = require("multer");
const multerS3 = require("multer-s3");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

const url = require("url");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

const decodeJWT = (token) => {
  return jwt.verify(token, secret);
};

// lists products
router.get("/all", async (req, res) => {
  const urlPath = url.parse(req.url, true);
  const query = urlPath.query;
  let result;
  result = await db.any(
    `select p.id as product_id , pc.name as category_name , pb.name as brand_name , p.name as product_name , p.price
    from products as p
    left join products_category as pc on p.category_id = pc.id
    left join products_brand as pb on p.brand_id = pb.id
        where (pc.id = $1 or $1 is null) and (pb.id = $2 or $2 is null)`,
    [query.category_id, query.brand_id]
  );
  return res.json(result);
});

// lists category
router.get("/category", async (req, res) => {
  let result = await db.any(
    `select pc.id as category_id, pc.name as category_name 
    from products_category as pc`
  );
  res.json(result);
});

router.get("/brand", async (req, res) => {
  const urlPath = url.parse(req.url, true);
  const query = urlPath.query;
  let result = await db.any(
    `select distinct on (pb.id) pb.id as brand_id , pb.name as brand_name
    from products_brand as pb
    left join products_brand_category as pbc on pb.id = pbc.brand_id
    where pbc.category_id = $1 or $1 is null
    `,
    [query.category_id]
  );
  res.json(result);
});

// Upload products
// const cpUpload = upload.fields([
//   { name: "title_image", maxCount: 1 },
//   { name: "detail_images", maxCount: 8 },
// ]);
router.post("/add_products", upload.single("title_image"), async (req, res) => {
  console.log(req.body);
  console.log(req.file);

  // generate image name
  const timeStamp = Date.now();
  const imageName = `${timeStamp}_${req.file.originalname}`;

  // resize image
  const buffer = await sharp(req.file.buffer)
    .resize({ width: 500, height: 500, fit: "contain" })
    .toBuffer();

  // upload to s3
  const paramsPut = {
    Bucket: bucketName,
    Body: buffer,
    Key: imageName,
  };

  const commandPut = new PutObjectCommand(paramsPut);
  const result = await s3.send(commandPut);
  console.log(result);

  // generate url
  const expiration = 604800;
  const paramsGetUrl = {
    Bucket: bucketName,
    Key: imageName,
  };
  const commandGet = new GetObjectCommand(paramsGetUrl);
  const imageUrl = await getSignedUrl(s3, commandGet, {
    expiresIn: expiration,
  });

  // insert data to postgresql
  const { category, brand, name, price, detail } = req.body;
  const detail_images = `{"detail_images": "url"}`;
  await db.any(
    `insert into products (category_id, brand_id, name, title_image, detail_images, price, detail, create_at, update_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      category,
      brand,
      name,
      imageUrl,
      detail_images,
      price,
      detail,
      new Date(),
      new Date(),
    ]
  );
  res.json({ status: "success" });
});

module.exports = router;
