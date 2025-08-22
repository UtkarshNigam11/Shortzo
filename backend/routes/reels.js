const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Reel = require('../models/Reel');
const User = require('../models/User');
const Category = require('../models/Category');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { uploadReelFiles, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/reels
// @desc    Create a new reel
// @access  Private
router.post('/', [
  authenticateToken,
  uploadReelFiles,
  handleUploadError,
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category').isIn(['Infotainment', 'Entertainment', 'News', 'Music', 'Dance', 'Makeup', 'Beauty', 'Edits', 'Comedy', 'Sports', 'Food', 'Travel', 'Education', 'Technology']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('isNSFW').optional().isBoolean().withMessage('isNSFW must be a boolean'),
  body('duration').isNumeric().withMessage('Duration must be a number')
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

    // Check if video file is uploaded
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }

    const { title, description = '', category, tags = [], isNSFW = false, duration } = req.body;
    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    // Parse tags if they come as a string
    let parsedTags = Array.isArray(tags) ? tags : [];
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Create reel object
    const reelData = {
      title,
      description,
      videoUrl: `/uploads/videos/${videoFile.filename}`,
      category,
      tags: parsedTags.filter(tag => tag && tag.length > 0),
      author: req.user._id,
      isNSFW,
      duration: parseFloat(duration),
      fileSize: videoFile.size
    };

    if (thumbnailFile) {
      reelData.thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
    }

    const reel = new Reel(reelData);
    await reel.save();

    // Update user's reels array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { reels: reel._id }
    });

    // Update category reel count
    await Category.findOneAndUpdate(
      { name: category },
      { $inc: { reelsCount: 1 } },
      { upsert: true }
    );

    // Populate author info for response
    await reel.populate('author', 'username profilePicture isVerified');

    res.status(201).json({
      success: true,
      message: 'Reel created successfully',
      data: { reel }
    });

  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during reel creation'
    });
  }
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
  query('sortBy').optional().isIn(['newest', 'oldest', 'trending', 'popular']).withMessage('Invalid sort option')
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { category, tags, sortBy = 'newest', search } = req.query;

    // Build filter object
    let filter = { isActive: true, isApproved: true };

    // Filter out NSFW content for non-authenticated users or users who haven't opted in
    if (!req.user || !req.user.preferredCategories?.includes('NSFW')) {
      filter.isNSFW = { $ne: true };
    }

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
        sort = { 'likes': -1, 'views': -1, createdAt: -1 };
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

    // Add engagement stats and user interaction status
    const reelsWithStats = reels.map(reel => {
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
    const totalPages = Math.ceil(totalReels / limit);

    res.json({
      success: true,
      data: {
        reels: reelsWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalReels,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reels'
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

    // Soft delete by setting isActive to false
    reel.isActive = false;
    await reel.save();

    // Remove from user's reels array
    await User.findByIdAndUpdate(reel.author, {
      $pull: { reels: reel._id }
    });

    res.json({
      success: true,
      message: 'Reel deleted successfully'
    });

  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting reel'
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

module.exports = router;
