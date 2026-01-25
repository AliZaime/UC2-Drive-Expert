const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middlewares/authMiddleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and Office documents
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = file.mimetype.includes('image') || file.mimetype.includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('spreadsheet');

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  }
});

/**
 * @route   POST /api/v1/upload
 * @desc    Upload file to Cloudinary
 * @access  Private
 */
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Aucun fichier fourni'
      });
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat_attachments',
          resource_type: 'auto',
          allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'webp']
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.status(200).json({
      status: 'success',
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    });
  } catch (error) {
    console.error('Upload error details:', error);
    res.status(500).json({
      status: 'error',
      message: `Upload fail: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
