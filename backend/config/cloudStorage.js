/**
 * Cloud Storage Configuration
 * Supports multiple cloud storage providers: Cloudinary, AWS S3
 */

const cloudinary = require('cloudinary').v2;
const AWS = require('aws-sdk');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multerS3 = require('multer-s3');
require('dotenv').config();

// Storage provider selection
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'cloudinary'; // 'cloudinary' or 's3'

// Cloudinary Configuration
if (STORAGE_PROVIDER === 'cloudinary') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// AWS S3 Configuration
let s3;
if (STORAGE_PROVIDER === 's3') {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
  
  s3 = new AWS.S3();
}

// File type validation
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

const fileFilter = (req, file, cb) => {
  const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes, ...allowedVideoTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Cloudinary Storage Configuration
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      if (allowedImageTypes.includes(file.mimetype)) {
        return 'sha-pay/images';
      } else if (allowedDocumentTypes.includes(file.mimetype)) {
        return 'sha-pay/documents';
      } else if (allowedVideoTypes.includes(file.mimetype)) {
        return 'sha-pay/videos';
      }
      return 'sha-pay/others';
    },
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'mp4', 'mpeg', 'mov', 'avi'],
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: 'limit',
        quality: 'auto:good'
      }
    ],
    resource_type: 'auto'
  }
});

// AWS S3 Storage Configuration
let s3Storage;
if (STORAGE_PROVIDER === 's3') {
  s3Storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'sha-pay-uploads',
    acl: 'public-read',
    key: function (req, file, cb) {
      const folder = allowedImageTypes.includes(file.mimetype) ? 'images' : 
                     allowedDocumentTypes.includes(file.mimetype) ? 'documents' : 
                     allowedVideoTypes.includes(file.mimetype) ? 'videos' : 'others';
      
      const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  });
}

// Multer Configuration
const upload = multer({
  storage: STORAGE_PROVIDER === 'cloudinary' ? cloudinaryStorage : s3Storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per upload
  }
});

// Upload middleware functions
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// Profile picture upload (single image)
const uploadProfilePicture = uploadSingle('profilePicture');

// Service images upload (multiple images)
const uploadServiceImages = uploadMultiple('serviceImages', 5);

// Document upload (single document)
const uploadDocument = uploadSingle('document');

// Mixed upload for service creation
const uploadServiceFiles = uploadFields([
  { name: 'serviceImages', maxCount: 5 },
  { name: 'documents', maxCount: 3 }
]);

// File deletion functions
const deleteFile = async (fileUrl) => {
  try {
    if (STORAGE_PROVIDER === 'cloudinary') {
      // Extract public_id from Cloudinary URL
      const publicId = extractCloudinaryPublicId(fileUrl);
      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
      }
    } else if (STORAGE_PROVIDER === 's3') {
      // Extract key from S3 URL
      const key = extractS3Key(fileUrl);
      if (key) {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key
        };
        const result = await s3.deleteObject(params).promise();
        return result;
      }
    }
    throw new Error('Invalid file URL or unsupported storage provider');
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Helper functions
const extractCloudinaryPublicId = (url) => {
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    
    // Include folder path if present
    const folderIndex = parts.findIndex(part => part === 'sha-pay');
    if (folderIndex !== -1) {
      const folderPath = parts.slice(folderIndex, -1).join('/');
      return `${folderPath}/${publicId}`;
    }
    
    return publicId;
  } catch (error) {
    console.error('Error extracting Cloudinary public ID:', error);
    return null;
  }
};

const extractS3Key = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    console.error('Error extracting S3 key:', error);
    return null;
  }
};

// File validation helper
const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.mimetype);
};

// Get file URL helper
const getFileUrl = (file) => {
  if (STORAGE_PROVIDER === 'cloudinary') {
    return file.path;
  } else if (STORAGE_PROVIDER === 's3') {
    return file.location;
  }
  return null;
};

// Storage health check
const checkStorageHealth = async () => {
  try {
    if (STORAGE_PROVIDER === 'cloudinary') {
      const result = await cloudinary.api.ping();
      return { status: 'healthy', provider: 'cloudinary', details: result };
    } else if (STORAGE_PROVIDER === 's3') {
      const params = { Bucket: process.env.AWS_S3_BUCKET };
      await s3.headBucket(params).promise();
      return { status: 'healthy', provider: 's3', bucket: process.env.AWS_S3_BUCKET };
    }
    throw new Error('Unknown storage provider');
  } catch (error) {
    return { status: 'unhealthy', provider: STORAGE_PROVIDER, error: error.message };
  }
};

module.exports = {
  // Upload middleware
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadProfilePicture,
  uploadServiceImages,
  uploadDocument,
  uploadServiceFiles,
  
  // File management
  deleteFile,
  validateFileType,
  getFileUrl,
  
  // Utilities
  checkStorageHealth,
  allowedImageTypes,
  allowedDocumentTypes,
  allowedVideoTypes,
  
  // Configuration
  STORAGE_PROVIDER,
  cloudinary: STORAGE_PROVIDER === 'cloudinary' ? cloudinary : null,
  s3: STORAGE_PROVIDER === 's3' ? s3 : null
};