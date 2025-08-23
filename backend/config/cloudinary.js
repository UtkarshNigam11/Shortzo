const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};

// Configure storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shortzo/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    transformation: [
      {
        quality: 'auto:good',
        fetch_format: 'auto',
        width: 720,
        height: 1280,
        crop: 'limit',
        flags: 'progressive'
      }
    ],
    // Generate a unique filename
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      return `video_${timestamp}_${randomString}`;
    }
  },
});

// Configure storage for thumbnails
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shortzo/thumbnails',
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      {
        width: 720,
        height: 1280,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive'
      }
    ],
    // Generate a unique filename
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      return `thumb_${timestamp}_${randomString}`;
    }
  },
});

// Avatar storage (smaller images)
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shortzo/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [
      {
        width: 400,
        height: 400,
        crop: 'fill',
        quality: 'auto:good',
        fetch_format: 'auto',
        gravity: 'face'
      }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      return `avatar_${timestamp}_${randomString}`;
    }
  },
});

// Multer upload configurations
const uploadVideo = multer({ 
  storage: videoStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024, // 50MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed!'), false);
      }
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
});

const uploadImage = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for avatars
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars!'), false);
    }
  }
});

// Combined upload for video + thumbnail
const uploadReel = multer({
  storage: multer.memoryStorage(), // We'll handle storage per field
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video field!'), false);
      }
    } else if (file.fieldname === 'thumbnail') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for thumbnail field!'), false);
      }
    } else {
      cb(null, true); // Allow other fields
    }
  }
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Helper functions
const uploadToCloudinary = async (buffer, resourceType = 'video', folder = 'shortzo/videos') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder,
        quality: 'auto:good',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Generate optimized URLs
const getOptimizedUrl = (publicId, resourceType = 'video', options = {}) => {
  const defaultOptions = {
    resource_type: resourceType,
    secure: true,
    quality: 'auto:good',
    fetch_format: 'auto'
  };

  return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

module.exports = {
  cloudinary,
  uploadVideo,
  uploadImage,
  uploadAvatar,
  uploadReel,
  videoStorage,
  imageStorage,
  avatarStorage,
  testCloudinaryConnection,
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl
};
