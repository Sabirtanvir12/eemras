const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WebP allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE }
});

/**
 * Uploads a buffer to Cloudinary after optional sharp processing
 */
async function uploadToCloudinary(buffer, publicId, folder = 'eemras/products') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

async function optimizeAndSave(buffer, originalName) {
  const publicId = uuidv4();
  
  // Optimize with Sharp
  const optimizedBuffer = await sharp(buffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  // Upload to Cloudinary
  const result = await uploadToCloudinary(optimizedBuffer, publicId);
  return result.secure_url;
}

async function optimizeThumbnail(buffer) {
  const publicId = `thumb_${uuidv4()}`;
  
  // Optimize with Sharp
  const optimizedBuffer = await sharp(buffer)
    .resize({ width: 600, height: 600, fit: 'cover' })
    .webp({ quality: 78 })
    .toBuffer();

  // Upload to Cloudinary
  const result = await uploadToCloudinary(optimizedBuffer, publicId);
  return result.secure_url;
}

async function deleteFile(urlOrPublicId) {
  if (!urlOrPublicId) return;

  try {
    let publicId = urlOrPublicId;

    // If it's a URL, try to extract the public_id
    // Cloudinary URLs: https://res.cloudinary.com/.../upload/v12345/folder/public_id.webp
    if (urlOrPublicId.startsWith('http')) {
      const parts = urlOrPublicId.split('/');
      const lastPart = parts[parts.length - 1];
      const filename = lastPart.split('.')[0];
      
      // If there's a folder, we need to include it
      // For EEMRAS we use eemras/products
      if (urlOrPublicId.includes('eemras/products')) {
        publicId = `eemras/products/${filename}`;
      } else {
        publicId = filename;
      }
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error('Error deleting from Cloudinary:', urlOrPublicId, err.message);
  }
}

module.exports = { upload, optimizeAndSave, optimizeThumbnail, deleteFile };
