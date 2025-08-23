const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const winston = require('winston');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Cloud storage services (optional)
const cloudinary = require('cloudinary').v2;
const AWS = require('aws-sdk');

// Upload service class
class UploadService {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/upload-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/upload.log' })
      ]
    });

    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    this.allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    this.initializeStorage();
    this.ensureUploadDirectories();
  }

  // Initialize cloud storage services
  initializeStorage() {
    try {
      // Cloudinary configuration
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        this.cloudinaryEnabled = true;
        this.logger.info('Cloudinary storage initialized');
      }

      // AWS S3 configuration
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) {
        this.s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1'
        });
        this.s3Enabled = true;
        this.s3Bucket = process.env.AWS_S3_BUCKET;
        this.logger.info('AWS S3 storage initialized');
      }
    } catch (error) {
      this.logger.error('Failed to initialize cloud storage:', { message: error.message, stack: error.stack });
    }
  }

  // Ensure upload directories exist
  async ensureUploadDirectories() {
    try {
      const directories = [
        path.join(this.uploadDir, 'profiles'),
        path.join(this.uploadDir, 'services'),
        path.join(this.uploadDir, 'documents'),
        path.join(this.uploadDir, 'temp')
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }

      this.logger.info('Upload directories ensured');
    } catch (error) {
      this.logger.error('Failed to create upload directories:', { message: error.message, stack: error.stack });
    }
  }

  // Generate unique filename
  generateFilename(originalName, prefix = '') {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}${timestamp}-${random}${ext}`;
  }

  // Validate file type
  validateFileType(mimetype, allowedTypes) {
    return allowedTypes.includes(mimetype);
  }

  // Create multer storage configuration
  createMulterStorage(destination, fileNamePrefix = '') {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.uploadDir, destination);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const filename = this.generateFilename(file.originalname, fileNamePrefix);
        cb(null, filename);
      }
    });
  }

  // Create multer upload middleware
  createUploadMiddleware(options = {}) {
    const {
      destination = 'temp',
      fileNamePrefix = '',
      maxFiles = 1,
      allowedTypes = this.allowedImageTypes,
      maxSize = this.maxFileSize
    } = options;

    const storage = this.createMulterStorage(destination, fileNamePrefix);

    const fileFilter = (req, file, cb) => {
      if (this.validateFileType(file.mimetype, allowedTypes)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: maxSize,
        files: maxFiles
      }
    });

    return maxFiles === 1 ? upload.single('file') : upload.array('files', maxFiles);
  }

  // Process and optimize image
  async processImage(inputPath, outputPath, options = {}) {
    try {
      const {
        width = null,
        height = null,
        quality = 80,
        format = 'jpeg',
        resize = true
      } = options;

      let pipeline = sharp(inputPath);

      // Resize if dimensions provided
      if (resize && (width || height)) {
        pipeline = pipeline.resize(width, height, {
          fit: 'cover',
          position: 'center'
        });
      }

      // Set format and quality
      if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      await pipeline.toFile(outputPath);

      // Get image metadata
      const metadata = await sharp(outputPath).metadata();
      
      this.logger.info('Image processed successfully', {
        inputPath,
        outputPath,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size
      });

      return {
        width: metadata.width,
        height: metadata.height,
        size: metadata.size,
        format: metadata.format
      };
    } catch (error) {
      this.logger.error('Image processing failed:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Upload to Cloudinary
  async uploadToCloudinary(filePath, options = {}) {
    try {
      if (!this.cloudinaryEnabled) {
        throw new Error('Cloudinary not configured');
      }

      const {
        folder = 'sha-pay',
        transformation = {},
        resourceType = 'image'
      } = options;

      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        transformation,
        resource_type: resourceType,
        unique_filename: true,
        overwrite: false
      });

      this.logger.info('File uploaded to Cloudinary', {
        publicId: result.public_id,
        url: result.secure_url
      });

      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };
    } catch (error) {
      this.logger.error('Cloudinary upload failed:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Upload to AWS S3
  async uploadToS3(filePath, key, options = {}) {
    try {
      if (!this.s3Enabled) {
        throw new Error('AWS S3 not configured');
      }

      const {
        contentType = 'application/octet-stream',
        acl = 'public-read',
        metadata = {}
      } = options;

      const fileContent = await fs.readFile(filePath);

      const params = {
        Bucket: this.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        ACL: acl,
        Metadata: metadata
      };

      const result = await this.s3.upload(params).promise();

      this.logger.info('File uploaded to S3', {
        key: result.Key,
        location: result.Location
      });

      return {
        key: result.Key,
        url: result.Location,
        etag: result.ETag
      };
    } catch (error) {
      this.logger.error('S3 upload failed:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file, userId) {
    try {
      const tempPath = file.path;
      const filename = this.generateFilename(file.originalname, `profile-${userId}-`);
      const localPath = path.join(this.uploadDir, 'profiles', filename);

      // Process image (resize and optimize)
      await this.processImage(tempPath, localPath, {
        width: 300,
        height: 300,
        quality: 85,
        format: 'jpeg'
      });

      let uploadResult = {
        filename,
        path: localPath,
        url: `/uploads/profiles/${filename}`,
        size: file.size
      };

      // Upload to cloud storage if available
      if (this.cloudinaryEnabled) {
        const cloudResult = await this.uploadToCloudinary(localPath, {
          folder: 'sha-pay/profiles',
          transformation: { width: 300, height: 300, crop: 'fill' }
        });
        uploadResult.cloudinary = cloudResult;
        uploadResult.url = cloudResult.url;
      } else if (this.s3Enabled) {
        const s3Result = await this.uploadToS3(localPath, `profiles/${filename}`, {
          contentType: 'image/jpeg'
        });
        uploadResult.s3 = s3Result;
        uploadResult.url = s3Result.url;
      }

      // Clean up temp file
      await fs.unlink(tempPath).catch(() => {});

      this.logger.info('Profile picture uploaded successfully', {
        userId,
        filename,
        url: uploadResult.url
      });

      return uploadResult;
    } catch (error) {
      // Clean up temp file on error
      if (file.path) {
        await fs.unlink(file.path).catch(() => {});
      }
      this.logger.error('Profile picture upload failed:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Upload service images
  async uploadServiceImages(files, serviceId) {
    try {
      const uploadResults = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tempPath = file.path;
        const filename = this.generateFilename(file.originalname, `service-${serviceId}-${i + 1}-`);
        const localPath = path.join(this.uploadDir, 'services', filename);

        // Process image (resize and optimize)
        await this.processImage(tempPath, localPath, {
          width: 800,
          height: 600,
          quality: 85,
          format: 'jpeg'
        });

        let uploadResult = {
          filename,
          path: localPath,
          url: `/uploads/services/${filename}`,
          size: file.size,
          order: i + 1
        };

        // Upload to cloud storage if available
        if (this.cloudinaryEnabled) {
          const cloudResult = await this.uploadToCloudinary(localPath, {
            folder: 'sha-pay/services',
            transformation: { width: 800, height: 600, crop: 'fill' }
          });
          uploadResult.cloudinary = cloudResult;
          uploadResult.url = cloudResult.url;
        } else if (this.s3Enabled) {
          const s3Result = await this.uploadToS3(localPath, `services/${filename}`, {
            contentType: 'image/jpeg'
          });
          uploadResult.s3 = s3Result;
          uploadResult.url = s3Result.url;
        }

        uploadResults.push(uploadResult);

        // Clean up temp file
        await fs.unlink(tempPath).catch(() => {});
      }

      this.logger.info('Service images uploaded successfully', {
        serviceId,
        count: uploadResults.length
      });

      return uploadResults;
    } catch (error) {
      // Clean up temp files on error
      for (const file of files) {
        if (file.path) {
          await fs.unlink(file.path).catch(() => {});
        }
      }
      this.logger.error('Service images upload failed:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Delete file from local storage
  async deleteLocalFile(filePath) {
    try {
      await fs.unlink(filePath);
      this.logger.info('Local file deleted', { filePath });
    } catch (error) {
      this.logger.error('Failed to delete local file:', { message: error.message, stack: error.stack });
    }
  }

  // Delete file from Cloudinary
  async deleteFromCloudinary(publicId) {
    try {
      if (!this.cloudinaryEnabled) {
        return;
      }

      await cloudinary.uploader.destroy(publicId);
      this.logger.info('File deleted from Cloudinary', { publicId });
    } catch (error) {
      this.logger.error('Failed to delete from Cloudinary:', { message: error.message, stack: error.stack });
    }
  }

  // Delete file from S3
  async deleteFromS3(key) {
    try {
      if (!this.s3Enabled) {
        return;
      }

      await this.s3.deleteObject({
        Bucket: this.s3Bucket,
        Key: key
      }).promise();

      this.logger.info('File deleted from S3', { key });
    } catch (error) {
      this.logger.error('Failed to delete from S3:', { message: error.message, stack: error.stack });
    }
  }

  // Delete uploaded file (all locations)
  async deleteUploadedFile(fileInfo) {
    try {
      // Delete from local storage
      if (fileInfo.path) {
        await this.deleteLocalFile(fileInfo.path);
      }

      // Delete from Cloudinary
      if (fileInfo.cloudinary && fileInfo.cloudinary.publicId) {
        await this.deleteFromCloudinary(fileInfo.cloudinary.publicId);
      }

      // Delete from S3
      if (fileInfo.s3 && fileInfo.s3.key) {
        await this.deleteFromS3(fileInfo.s3.key);
      }

      this.logger.info('File deleted from all locations', { fileInfo });
    } catch (error) {
      this.logger.error('Failed to delete uploaded file:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Clean up old temp files
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const tempDir = path.join(this.uploadDir, 'temp');
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      this.logger.info('Temp files cleanup completed', {
        totalFiles: files.length,
        deletedFiles: deletedCount
      });

      return deletedCount;
    } catch (error) {
      this.logger.error('Temp files cleanup failed:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Get file info
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: ext,
        isImage: this.allowedImageTypes.includes(this.getMimeType(ext))
      };
    } catch (error) {
      this.logger.error('Failed to get file info:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Get MIME type from extension
  getMimeType(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  // Initialize method for external calls
  async initialize() {
    this.logger.info('Upload service initialized');
    return true;
  }
}

// Create and export singleton instance
const uploadService = new UploadService();
module.exports = uploadService;