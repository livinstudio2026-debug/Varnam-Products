import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Helper function to create dynamic folder destinations in Cloudinary
const createStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `varnam-organic/${folderName}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }], // Auto-optimization
    },
  });
};

// Custom file filter to ensure only images are processed
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are permitted!'), false);
  }
};

// Configured Multer Storage Parsers
export const uploadProductStorage = multer({
  storage: createStorage('products'),
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
  fileFilter,
});

export const uploadCategoryStorage = multer({
  storage: createStorage('categories'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter,
});

export const uploadBannerStorage = multer({
  storage: createStorage('banners'),
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB limit for banners
  },
  fileFilter,
});