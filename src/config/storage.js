const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

const storageClient = new S3Client({
  region: process.env.STORAGE_REGION,
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
});

module.exports = { storageClient, bucket: process.env.STORAGE_BUCKET };
