const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, documents, and ZIP files are allowed.'), false);
  }
};

// Multer configuration for memory storage (for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB default
  },
  fileFilter: fileFilter,
});

// Upload to S3
exports.uploadToS3 = async (file) => {
  const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `attachments/${fileName}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private',
  };

  try {
    const data = await s3.upload(params).promise();
    return {
      fileName: fileName,
      originalName: file.originalname,
      fileUrl: data.Location,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('File upload failed');
  }
};

// Delete from S3
exports.deleteFromS3 = async (fileName) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `attachments/${fileName}`,
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('File deletion failed');
  }
};

// Get signed URL for private files
exports.getSignedUrl = (fileName, expiresIn = 3600) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `attachments/${fileName}`,
    Expires: expiresIn,
  };

  return s3.getSignedUrl('getObject', params);
};

// Multer middleware
exports.uploadMiddleware = upload;
