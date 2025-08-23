const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Reel = require('../models/Reel');
const User = require('../models/User');
const Category = require('../models/Category');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { uploadReel, uploadToCloudinary, deleteFromCloudinary, getOptimizedUrl } = require('../config/cloudinary');
const { validateReelsBatch, markInvalidReelsInactive } = require('../utils/cloudinaryValidator');

const router = express.Router();

// @route   POST /api/reels
// @desc    Create a new reel
// @access  Private
router.post('/', [
  authenticateToken
], (req, res) => {
  uploadReel(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    try {
      // Debug: Log received data
      console.log('Received req.body:', req.body);
      console.log('Received req.files:', req.files ? Object.keys(req.files) : 'none');

      // Manual validation after multer processing
      const { title, description = '', category, tags = [], isNSFW = false, duration } = req.body;

      // Validate required fields
      if (!title || title.trim().length === 0 || title.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Title must be between 1 and 100 characters'
        });
      }

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required'
        });
      }

      const validCategories = ['Infotainment', 'Entertainment', 'News', 'Music', 'Dance', 'Makeup', 'Beauty', 'Edits', 'Comedy', 'Sports', 'Food', 'Travel', 'Education', 'Technology'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }

      const numDuration = parseFloat(duration);
      if (!duration || isNaN(numDuration) || numDuration <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be a positive number'
        });
      }

      if (description && description.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 500 characters'
        });
      }

      // Check if video file is uploaded
      if (!req.files || !req.files.video || req.files.video.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Video file is required'
        });
      }

      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

      // Convert FormData string values to proper types
      const parsedDuration = parseFloat(duration) || 30;
      const parsedIsNSFW = isNSFW === 'true' || isNSFW === true;

      // Additional validation for converted values
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid duration value'
        });
      }

      // Parse tags if they come as a string
      let parsedTags = Array.isArray(tags) ? tags : [];
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          parsedTags = tags.split(',').map(tag => tag.trim());
        }
      }

      // Upload video to Cloudinary
      console.log('Uploading video to Cloudinary...');
      console.log('Video file size:', videoFile.buffer.length, 'bytes');
      const videoResult = await uploadToCloudinary(
        videoFile.buffer, 
        'video', 
        'shortzo/videos'
      );
      console.log('Video uploaded successfully:', videoResult.secure_url);

      // Upload thumbnail to Cloudinary (if provided)
      let thumbnailResult = null;
      if (thumbnailFile) {
        console.log('Uploading thumbnail to Cloudinary...');
        thumbnailResult = await uploadToCloudinary(
          thumbnailFile.buffer, 
          'image', 
          'shortzo/thumbnails'
        );
      }

      // Create reel object with Cloudinary URLs
      const reelData = {
        title,
        description,
        videoUrl: videoResult.secure_url,
        cloudinaryVideoId: videoResult.public_id,
        category,
        tags: parsedTags.filter(tag => tag && tag.length > 0),
        author: req.user._id,
        isNSFW: parsedIsNSFW,
        duration: parsedDuration,
        fileSize: videoResult.bytes,
        views: [],
        likes: [],
        comments: []
      };

      if (thumbnailResult) {
        reelData.thumbnailUrl = thumbnailResult.secure_url;
        reelData.cloudinaryThumbnailId = thumbnailResult.public_id;
      }

      console.log('Creating new Reel document with data:', reelData);
      const reel = new Reel(reelData);
      console.log('Saving reel to database...');
      await reel.save();
      console.log('Reel saved successfully, ID:', reel._id);

      // Update user's reels array
      console.log('Updating user reels array...');
      await User.findByIdAndUpdate(req.user._id, {
        $push: { reels: reel._id }
      });
      console.log('User reels array updated');

      // Update category reel count
      console.log('Updating category reel count...');
      await Category.findOneAndUpdate(
        { name: category },
        { $inc: { reelsCount: 1 } },
        { upsert: true }
      );
      console.log('Category reel count updated');

      // Populate author info for response
      console.log('Populating author info...');
      const populatedReel = await Reel.findById(reel._id).populate('author', 'username profilePicture isVerified');
      console.log('Author info populated');

      console.log('Sending success response...');
      res.status(201).json({
        success: true,
        message: 'Reel uploaded successfully!',
        data: { reel: populatedReel }
      });

    } catch (error) {
      console.error('Create reel error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // If there was an error after uploading to Cloudinary, try to clean up
      if (error.videoResult?.public_id) {
        try {
          await deleteFromCloudinary(error.videoResult.public_id, 'video');
        } catch (cleanupError) {
          console.error('Failed to cleanup video from Cloudinary:', cleanupError);
        }
      }
      
      if (error.thumbnailResult?.public_id) {
        try {
          await deleteFromCloudinary(error.thumbnailResult.public_id, 'image');
        } catch (cleanupError) {
          console.error('Failed to cleanup thumbnail from Cloudinary:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during reel creation'
      });
    }
  });
});

// @route   GET /api/reels
// @desc    Get reels with filtering and pagination
// @access  Public (optional auth)
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('tags').optional().isString().withMessage('Tags must be a string'),
  query('sortBy').optional().isIn(['newest', 'oldest', 'trending', 'popular']).withMessage('Invalid sort option'),
  query('showNSFW').optional().isIn(['true', 'false']).withMessage('showNSFW must be true or false')
], async (req, res) => {
  try {
    console.log('GET /api/reels - Query params:', req.query);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('GET reels validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { category, tags, sortBy = 'newest', search, userId } = req.query;

    // Build filter object
    let filter = { isActive: true, isApproved: true };

    // Filter by specific user if userId is provided
    if (userId) {
      filter.author = userId;
    }

    // Filter out NSFW content for non-authenticated users or users who haven't opted in
    if (!req.user || !req.user.preferredCategories?.includes('NSFW')) {
      filter.isNSFW = { $ne: true };
    }

    console.log('Built filter:', filter, 'User:', req.user ? req.user.username : 'No user');

    if (category) {
      filter.category = category;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'trending':
        sort = { isTrending: -1, createdAt: -1 };
        break;
      case 'popular':
        sort = { createdAt: -1 }; // For now, sort by newest since we need aggregation for proper popularity sorting
        break;
      default: // newest
        sort = { createdAt: -1 };
    }

    const reels = await Reel.find(filter)
      .populate('author', 'username profilePicture isVerified')
      .populate('comments', null, null, { limit: 3, populate: { path: 'author', select: 'username profilePicture' } })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('Database query result:', {
      filter,
      foundReelsCount: reels.length,
      totalReelsInDB: await Reel.countDocuments(),
      firstReelAuthor: reels[0]?.author,
      firstReelAuthorId: reels[0]?.author?._id || reels[0]?.author
    });

    // Validate Cloudinary videos exist (only for first few requests per hour to avoid API limits)
    let validatedReels = reels;
    const shouldValidate = Math.random() < 0.1; // 10% chance to validate per request
    
    if (shouldValidate && reels.length > 0) {
      console.log('🔍 Validating Cloudinary videos for reels...');
      const { validReels, invalidReelIds } = await validateReelsBatch(reels, 5, 200);
      
      if (invalidReelIds.length > 0) {
        console.log(`⚠️  Found ${invalidReelIds.length} reels with missing Cloudinary videos`);
        await markInvalidReelsInactive(invalidReelIds);
        validatedReels = validReels;
      }
    }

    // Add engagement stats and user interaction status
    const reelsWithStats = validatedReels.map(reel => {
      const reelData = {
        ...reel,
        likesCount: reel.likes?.length || 0,
        commentsCount: reel.comments?.length || 0,
        sharesCount: reel.shares?.length || 0,
        viewsCount: reel.views?.length || 0,
        isLiked: req.user ? reel.likes?.some(like => like.user.toString() === req.user._id.toString()) : false,
        isSaved: req.user ? req.user.savedReels?.includes(reel._id) : false
      };

      // Remove the full arrays to reduce payload size
      delete reelData.likes;
      delete reelData.shares;
      delete reelData.views;
      
      return reelData;
    });

    const totalReels = await Reel.countDocuments(filter);

    console.log('Sending response to frontend:', {
      reelsCount: reelsWithStats.length,
      firstReelTitle: reelsWithStats[0]?.title,
      totalReels
    });

    res.json({
      success: true,
      message: 'Reels fetched successfully',
      data: reelsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReels / limit),
        totalReels,
      },
    });

  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reels'
    });
  }
});

// @route   GET /api/reels/trending
// @desc    Get trending reels
// @access  Public (optional auth)
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    let filter = { isActive: true, isApproved: true, isTrending: true };

    // Filter NSFW content
    if (!req.user || !req.user.preferredCategories?.includes('NSFW')) {
      filter.isNSFW = { $ne: true };
    }

    const trendingReels = await Reel.find(filter)
      .populate('author', 'username profilePicture isVerified')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const reelsWithStats = trendingReels.map(reel => ({
      ...reel,
      likesCount: reel.likes?.length || 0,
      commentsCount: reel.comments?.length || 0,
      sharesCount: reel.shares?.length || 0,
      viewsCount: reel.views?.length || 0,
      isLiked: req.user ? reel.likes?.some(like => like.user.toString() === req.user._id.toString()) : false
    }));

    res.json({
      success: true,
      data: { reels: reelsWithStats }
    });

  } catch (error) {
    console.error('Get trending reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending reels'
    });
  }
});

// @route   GET /api/reels/:id
// @desc    Get single reel by ID
// @access  Public (optional auth)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('author', 'username profilePicture isVerified bio followersCount')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePicture isVerified'
        },
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if reel is active and approved
    if (!reel.isActive || !reel.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Reel not available'
      });
    }

    // Add view if user is authenticated
    if (req.user) {
      reel.addView(req.user._id);
      await reel.save();
    }

    // Prepare response data
    const reelData = {
      ...reel.toObject(),
      likesCount: reel.likes.length,
      commentsCount: reel.comments.length,
      sharesCount: reel.shares.length,
      viewsCount: reel.views.length,
      isLiked: req.user ? reel.likes.some(like => like.user.toString() === req.user._id.toString()) : false,
      isSaved: req.user ? req.user.savedReels?.includes(reel._id) : false
    };

    // Remove full arrays to reduce payload
    delete reelData.likes;
    delete reelData.shares;
    delete reelData.views;

    res.json({
      success: true,
      data: { reel: reelData }
    });

  } catch (error) {
    console.error('Get reel error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reel ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reel'
    });
  }
});

// @route   POST /api/reels/:id/like
// @desc    Like/Unlike a reel
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const liked = reel.addLike(req.user._id);
    await reel.save();

    // Update user's liked reels
    if (liked) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { likedReels: reel._id }
      });
    } else {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { likedReels: reel._id }
      });
    }

    res.json({
      success: true,
      message: liked ? 'Reel liked' : 'Reel unliked',
      data: {
        liked,
        likesCount: reel.likes.length
      }
    });

  } catch (error) {
    console.error('Like reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while liking reel'
    });
  }
});

// @route   POST /api/reels/:id/share
// @desc    Share a reel
// @access  Private
router.post('/:id/share', [
  authenticateToken,
  body('platform').optional().isIn(['internal', 'facebook', 'twitter', 'instagram', 'whatsapp', 'copy-link']).withMessage('Invalid platform')
], async (req, res) => {
  try {
    const { platform = 'internal' } = req.body;
    
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Add share record
    reel.shares.push({
      user: req.user._id,
      platform
    });
    
    await reel.save();

    res.json({
      success: true,
      message: 'Reel shared successfully',
      data: {
        sharesCount: reel.shares.length,
        shareUrl: `${req.protocol}://${req.get('host')}/reel/${reel._id}`
      }
    });

  } catch (error) {
    console.error('Share reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sharing reel'
    });
  }
});

// @route   PUT /api/reels/:id
// @desc    Update a reel
// @access  Private (author only)
router.put('/:id', [
  authenticateToken,
  body('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category').optional().isIn(['Infotainment', 'Entertainment', 'News', 'Music', 'Dance', 'Makeup', 'Beauty', 'Edits', 'Comedy', 'Sports', 'Food', 'Travel', 'Education', 'Technology']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isNSFW').optional().isBoolean().withMessage('isNSFW must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if user is the author
    if (reel.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reel'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'category', 'tags', 'isNSFW'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        reel[field] = req.body[field];
      }
    });

    await reel.save();
    await reel.populate('author', 'username profilePicture isVerified');

    res.json({
      success: true,
      message: 'Reel updated successfully',
      data: { reel }
    });

  } catch (error) {
    console.error('Update reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating reel'
    });
  }
});

// @route   DELETE /api/reels/:id
// @desc    Delete a reel
// @access  Private (author only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if user is the author or admin
    if (reel.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reel'
      });
    }

    try {
      // Delete video from Cloudinary
      if (reel.cloudinaryVideoId) {
        console.log('Deleting video from Cloudinary:', reel.cloudinaryVideoId);
        await deleteFromCloudinary(reel.cloudinaryVideoId, 'video');
      }
      
      // Delete thumbnail from Cloudinary if exists
      if (reel.cloudinaryThumbnailId) {
        console.log('Deleting thumbnail from Cloudinary:', reel.cloudinaryThumbnailId);
        await deleteFromCloudinary(reel.cloudinaryThumbnailId, 'image');
      }
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Remove from user's reels array
    await User.findByIdAndUpdate(reel.author, {
      $pull: { reels: reel._id }
    });

    // Decrease category count
    await Category.updateOne(
      { name: reel.category },
      { $inc: { reelsCount: -1 } }
    );

    // Permanently delete from database (hard delete)
    await Reel.findByIdAndDelete(req.params.id);

    console.log(`Successfully deleted reel: ${reel.title}`);

    res.json({
      success: true,
      message: 'Reel deleted successfully from both database and cloud storage'
    });

  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting reel'
    });
  }
});

// @route   POST /api/reels/cleanup-orphaned
// @desc    Clean up reels with missing Cloudinary videos (Admin only)
// @access  Private/Admin
router.post('/cleanup-orphaned', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin role check here)
    // For now, assuming authenticated users can trigger cleanup
    
    console.log('🧹 Starting orphaned reels cleanup...');
    
    // Get all reels
    const allReels = await Reel.find({}).select('title cloudinaryVideoId author category');
    
    if (allReels.length === 0) {
      return res.json({
        success: true,
        message: 'No reels found in database',
        data: { cleaned: 0, total: 0 }
      });
    }
    
    console.log(`📊 Found ${allReels.length} reels to validate`);
    
    // Validate reels in batches
    const { validReels, invalidReelIds } = await validateReelsBatch(allReels, 10, 300);
    
    if (invalidReelIds.length === 0) {
      return res.json({
        success: true,
        message: 'All reels have valid Cloudinary videos',
        data: { cleaned: 0, total: allReels.length }
      });
    }
    
    console.log(`⚠️  Found ${invalidReelIds.length} orphaned reels`);
    
    // Update related collections and delete orphaned reels
    let cleanedCount = 0;
    
    for (const reelId of invalidReelIds) {
      try {
        const reel = await Reel.findById(reelId);
        if (reel) {
          // Remove reel from user's reels array
          await User.updateMany(
            { reels: reelId },
            { $pull: { reels: reelId } }
          );

          // Decrease category reel count
          await Category.updateOne(
            { name: reel.category },
            { $inc: { reelsCount: -1 } }
          );

          // Delete the reel
          await Reel.findByIdAndDelete(reelId);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error cleaning reel ${reelId}:`, error);
      }
    }
    
    console.log(`🎉 Cleanup completed! Removed ${cleanedCount} orphaned reels`);
    
    res.json({
      success: true,
      message: `Successfully cleaned up ${cleanedCount} orphaned reels`,
      data: { 
        cleaned: cleanedCount, 
        total: allReels.length,
        remaining: allReels.length - cleanedCount
      }
    });
    
  } catch (error) {
    console.error('Cleanup orphaned reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up orphaned reels',
      error: error.message
    });
  }
});

module.exports = router;
