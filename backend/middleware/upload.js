// middleware/upload.js
import multer from 'multer';
import { storage } from '../config/cloudinary.js';

// Image files filter
const imageFileFilter = (req, file, cb) => {
  console.log(`Checking file type: ${file.mimetype}`);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    console.log('File rejected: Not an image file');
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Document files filter
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  console.log(`Checking document file type: ${file.mimetype}`);
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log(`File rejected: Invalid document type ${file.mimetype}`);
    cb(new Error(`Invalid file type. Allowed types: PDF, Images, Word and Excel documents. Got: ${file.mimetype}`), false);
  }
};

// Create different multer instances using Cloudinary storage
const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
});

const uploadProfilePic = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
});

const uploadDocument = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: documentFileFilter
});

// Export all needed items
export { 
  uploadImage, 
  uploadProfilePic, 
  uploadDocument
};
