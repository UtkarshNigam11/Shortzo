const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Reel = require('../models/Reel');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { uploadProfile, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/users/profile/:username
// @desc    Get user profile by username
// @access  Public (optional auth)
router.get('/profile/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('reels', '_id title thumbnailUrl viewsCount likesCount createdAt category')
      .select('-password -email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User account not available'
      });
    }

    const isFollowing = req.user ? user.followers.includes(req.user._id) : false;
    const isOwnProfile = req.user ? user._id.toString() === req.user._id.toString() : false;

    const profileData = {
      _id: user._id,
      username: user.username,
      bio: user.bio,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      reelsCount: user.reels.length,
      joinedAt: user.joinedAt,
      isFollowing,
      isOwnProfile,
      reels: user.reels.filter(reel => reel.isActive !== false) // Only show active reels
    };

    res.json({
      success: true,
      data: { user: profileData }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  authenticateToken,
  uploadProfile,
  handleUploadError,
  body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('bio').optional().isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters'),
  body('preferredCategories').optional().isArray().withMessage('Preferred categories must be an array')
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

    const user = await User.findById(req.user._id);
    const { username, bio, preferredCategories } = req.body;

    // Check if username is being changed and if it's available
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (preferredCategories) user.preferredCategories = preferredCategories;

    // Handle profile picture upload
    if (req.file) {
      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      preferredCategories: user.preferredCategories,
      isVerified: user.isVerified,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userData }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Follow/Unfollow a user
// @access  Private
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(userToFollow._id);
      userToFollow.followers.pull(currentUser._id);
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
    }

    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.json({
      success: true,
      message: isFollowing ? 'User unfollowed' : 'User followed',
      data: {
        isFollowing: !isFollowing,
        followersCount: userToFollow.followers.length
      }
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while following user'
    });
  }
});

// @route   GET /api/users/followers/:userId
// @desc    Get user followers
// @access  Public (optional auth)
router.get('/followers/:userId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'followers',
        select: 'username profilePicture isVerified bio',
        options: {
          skip,
          limit
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const totalFollowers = user.followers.length;
    const totalPages = Math.ceil(totalFollowers / limit);

    res.json({
      success: true,
      data: {
        followers: user.followers,
        pagination: {
          currentPage: page,
          totalPages,
          totalFollowers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching followers'
    });
  }
});

// @route   GET /api/users/following/:userId
// @desc    Get user following
// @access  Public (optional auth)
router.get('/following/:userId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'following',
        select: 'username profilePicture isVerified bio',
        options: {
          skip,
          limit
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const totalFollowing = user.following.length;
    const totalPages = Math.ceil(totalFollowing / limit);

    res.json({
      success: true,
      data: {
        following: user.following,
        pagination: {
          currentPage: page,
          totalPages,
          totalFollowing,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching following'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Public (optional auth)
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const searchRegex = new RegExp(q.trim(), 'i');
    
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { bio: searchRegex }
      ],
      isActive: true
    })
    .select('username profilePicture isVerified bio followersCount')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ isVerified: -1, followersCount: -1 }); // Verified users and popular users first

    const totalUsers = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { bio: searchRegex }
      ],
      isActive: true
    });

    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

// @route   GET /api/users/suggested
// @desc    Get suggested users to follow
// @access  Private
router.get('/suggested', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const currentUser = await User.findById(req.user._id);

    // Find users that current user is not following
    // and who have similar interests (preferred categories)
    const suggestedUsers = await User.find({
      _id: { 
        $ne: currentUser._id, 
        $nin: currentUser.following 
      },
      isActive: true,
      $or: [
        { preferredCategories: { $in: currentUser.preferredCategories } },
        { isVerified: true }
      ]
    })
    .select('username profilePicture isVerified bio followersCount preferredCategories')
    .sort({ isVerified: -1, followersCount: -1 })
    .limit(limit);

    res.json({
      success: true,
      data: { users: suggestedUsers }
    });

  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suggested users'
    });
  }
});

// @route   POST /api/users/save-reel/:reelId
// @desc    Save/Unsave a reel
// @access  Private
router.post('/save-reel/:reelId', authenticateToken, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId);
    
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const user = await User.findById(req.user._id);
    const isSaved = user.savedReels.includes(reel._id);

    if (isSaved) {
      user.savedReels.pull(reel._id);
    } else {
      user.savedReels.push(reel._id);
    }

    await user.save();

    res.json({
      success: true,
      message: isSaved ? 'Reel removed from saved' : 'Reel saved successfully',
      data: {
        isSaved: !isSaved,
        savedReelsCount: user.savedReels.length
      }
    });

  } catch (error) {
    console.error('Save reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving reel'
    });
  }
});

// @route   GET /api/users/saved-reels
// @desc    Get user's saved reels
// @access  Private
router.get('/saved-reels', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedReels',
        populate: {
          path: 'author',
          select: 'username profilePicture isVerified'
        },
        options: {
          skip,
          limit,
          sort: { createdAt: -1 }
        }
      });

    const totalSavedReels = user.savedReels.length;
    const totalPages = Math.ceil(totalSavedReels / limit);

    res.json({
      success: true,
      data: {
        reels: user.savedReels,
        pagination: {
          currentPage: page,
          totalPages,
          totalSavedReels,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get saved reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching saved reels'
    });
  }
});

// @route   GET /api/users/bookmarks
// @desc    Get user's bookmarked/saved reels
// @access  Private
router.get('/bookmarks', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    
    if (!user.savedReels || user.savedReels.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalReels: 0,
        }
      });
    }

    const savedReels = await Reel.find({
      _id: { $in: user.savedReels },
      isActive: true
    })
    .populate('author', 'username profilePicture isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // Add engagement stats
    const reelsWithStats = savedReels.map(reel => ({
      ...reel,
      likesCount: reel.likes?.length || 0,
      commentsCount: reel.comments?.length || 0,
      sharesCount: reel.shares?.length || 0,
      viewsCount: reel.views?.length || 0,
      isLiked: reel.likes?.some(like => like.user.toString() === req.user._id.toString()) || false,
      isSaved: true // Always true since these are saved reels
    }));

    const totalSavedReels = user.savedReels.length;

    res.json({
      success: true,
      data: reelsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSavedReels / limit),
        totalReels: totalSavedReels,
      }
    });

  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookmarks'
    });
  }
});

// @route   GET /api/users/liked-reels
// @desc    Get user's liked reels
// @access  Private
router.get('/liked-reels', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find reels that the user has liked
    const likedReels = await Reel.find({
      'likes.user': req.user._id,
      isActive: true
    })
    .populate('author', 'username profilePicture isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // Add engagement stats
    const reelsWithStats = likedReels.map(reel => ({
      ...reel,
      likesCount: reel.likes?.length || 0,
      commentsCount: reel.comments?.length || 0,
      sharesCount: reel.shares?.length || 0,
      viewsCount: reel.views?.length || 0,
      isLiked: true, // Always true since these are liked reels
      isSaved: req.user.savedReels?.includes(reel._id) || false
    }));

    const totalLikedReels = await Reel.countDocuments({
      'likes.user': req.user._id,
      isActive: true
    });

    res.json({
      success: true,
      data: reelsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLikedReels / limit),
        totalReels: totalLikedReels,
      }
    });

  } catch (error) {
    console.error('Get liked reels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching liked reels'
    });
  }
});

module.exports = router;
