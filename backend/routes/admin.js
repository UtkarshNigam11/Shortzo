const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const { authenticateToken, requireAdmin, requireModerator } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [
      totalUsers,
      totalReels,
      totalComments,
      totalCategories,
      newUsersThisWeek,
      newReelsThisWeek,
      newCommentsThisWeek,
      pendingReels,
      reportedReels,
      reportedComments
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Reel.countDocuments({ isActive: true }),
      Comment.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: lastWeek }, isActive: true }),
      Reel.countDocuments({ createdAt: { $gte: lastWeek }, isActive: true }),
      Comment.countDocuments({ createdAt: { $gte: lastWeek }, isActive: true }),
      Reel.countDocuments({ isApproved: false, isActive: true }),
      Reel.countDocuments({ 'reports.0': { $exists: true }, isActive: true }),
      Comment.countDocuments({ 'reports.0': { $exists: true }, isActive: true })
    ]);

    // Get category statistics
    const categoryStats = await Reel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get top users by followers
    const topUsers = await User.find({ isActive: true })
      .select('username profilePicture followersCount reelsCount')
      .sort({ followersCount: -1 })
      .limit(5);

    // Get recent activity
    const recentReels = await Reel.find({ isActive: true })
      .populate('author', 'username profilePicture')
      .select('title author createdAt category')
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      overview: {
        totalUsers,
        totalReels,
        totalComments,
        totalCategories,
        newUsersThisWeek,
        newReelsThisWeek,
        newCommentsThisWeek
      },
      moderation: {
        pendingReels,
        reportedReels,
        reportedComments
      },
      categoryStats,
      topUsers,
      recentReels
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin only)
router.get('/users', [
  authenticateToken,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('sortBy').optional().isIn(['newest', 'oldest', 'username', 'followers']).withMessage('Invalid sort option')
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
    const { search, role, isActive, sortBy = 'newest' } = req.query;

    // Build filter
    let filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'username':
        sort = { username: 1 };
        break;
      case 'followers':
        sort = { followersCount: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const usersWithStats = users.map(user => ({
      ...user.toObject(),
      followersCount: user.followers.length,
      followingCount: user.following.length,
      reelsCount: user.reels.length
    }));

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin action)
// @access  Private (Admin only)
router.put('/users/:id', [
  authenticateToken,
  requireAdmin,
  body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isVerified').optional().isBoolean().withMessage('isVerified must be a boolean')
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

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { role, isActive, isVerified } = req.body;

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: userData }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   GET /api/admin/reels
// @desc    Get all reels for moderation
// @access  Private (Moderator/Admin)
router.get('/reels', [
  authenticateToken,
  requireModerator,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('isApproved').optional().isBoolean().withMessage('isApproved must be a boolean'),
  query('isReported').optional().isBoolean().withMessage('isReported must be a boolean'),
  query('sortBy').optional().isIn(['newest', 'oldest', 'popular', 'reported']).withMessage('Invalid sort option')
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
    const { category, isApproved, isReported, sortBy = 'newest' } = req.query;

    // Build filter
    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (isReported === 'true') filter['reports.0'] = { $exists: true };

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'popular':
        sort = { likesCount: -1, viewsCount: -1 };
        break;
      case 'reported':
        sort = { 'reports': -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const reels = await Reel.find(filter)
      .populate('author', 'username profilePicture isVerified')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const reelsWithStats = reels.map(reel => ({
      ...reel.toObject(),
      likesCount: reel.likes.length,
      commentsCount: reel.comments.length,
      viewsCount: reel.views.length,
      sharesCount: reel.shares.length,
      reportsCount: reel.reports.length
    }));

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
    console.error('Get reels for moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reels'
    });
  }
});

// @route   PUT /api/admin/reels/:id/approve
// @desc    Approve/Disapprove a reel
// @access  Private (Moderator/Admin)
router.put('/reels/:id/approve', [
  authenticateToken,
  requireModerator,
  body('isApproved').isBoolean().withMessage('isApproved must be a boolean')
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

    const { isApproved } = req.body;

    reel.isApproved = isApproved;
    reel.approvedBy = req.user._id;
    reel.approvedAt = new Date();

    await reel.save();

    res.json({
      success: true,
      message: `Reel ${isApproved ? 'approved' : 'disapproved'} successfully`,
      data: { reel }
    });

  } catch (error) {
    console.error('Approve reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving reel'
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Get reported content
// @access  Private (Moderator/Admin)
router.get('/reports', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { type = 'all' } = req.query; // 'reels', 'comments', or 'all'

    let reportedReels = [];
    let reportedComments = [];

    if (type === 'all' || type === 'reels') {
      reportedReels = await Reel.find({
        'reports.0': { $exists: true },
        isActive: true
      })
      .populate('author', 'username profilePicture')
      .populate('reports.user', 'username')
      .sort({ 'reports.reportedAt': -1 })
      .limit(10);
    }

    if (type === 'all' || type === 'comments') {
      reportedComments = await Comment.find({
        'reports.0': { $exists: true },
        isActive: true
      })
      .populate('author', 'username profilePicture')
      .populate('reel', 'title')
      .populate('reports.user', 'username')
      .sort({ 'reports.reportedAt': -1 })
      .limit(10);
    }

    res.json({
      success: true,
      data: {
        reportedReels,
        reportedComments
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports'
    });
  }
});

// @route   POST /api/admin/reports/resolve
// @desc    Resolve a report
// @access  Private (Moderator/Admin)
router.post('/reports/resolve', [
  authenticateToken,
  requireModerator,
  body('contentType').isIn(['reel', 'comment']).withMessage('Invalid content type'),
  body('contentId').isMongoId().withMessage('Invalid content ID'),
  body('action').isIn(['dismiss', 'remove', 'warn']).withMessage('Invalid action')
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

    const { contentType, contentId, action } = req.body;
    let content;

    if (contentType === 'reel') {
      content = await Reel.findById(contentId);
    } else {
      content = await Comment.findById(contentId);
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    switch (action) {
      case 'remove':
        content.isActive = false;
        break;
      case 'warn':
        // In a real app, you might send a warning to the user
        break;
      case 'dismiss':
        // Just clear the reports
        break;
    }

    // Clear reports
    content.reports = [];
    await content.save();

    res.json({
      success: true,
      message: `Report resolved with action: ${action}`
    });

  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resolving report'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private (Admin only)
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // User growth
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Content creation
    const contentGrowth = await Reel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category distribution
    const categoryDistribution = await Reel.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Engagement metrics
    const engagementMetrics = await Reel.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $project: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          viewsCount: { $size: '$views' },
          sharesCount: { $size: '$shares' }
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' },
          totalViews: { $sum: '$viewsCount' },
          totalShares: { $sum: '$sharesCount' },
          avgLikes: { $avg: '$likesCount' },
          avgComments: { $avg: '$commentsCount' },
          avgViews: { $avg: '$viewsCount' },
          avgShares: { $avg: '$sharesCount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        userGrowth,
        contentGrowth,
        categoryDistribution,
        engagementMetrics: engagementMetrics[0] || {}
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;
