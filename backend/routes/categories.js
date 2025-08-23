const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Reel = require('../models/Reel');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public (optional auth)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name slug description icon color reelsCount featuredReels');

    // For each category, get a few featured reels
    const categoriesWithReels = await Promise.all(
      categories.map(async (category) => {
        let featuredReels = [];
        
        if (category.featuredReels.length > 0) {
          featuredReels = await Reel.find({
            _id: { $in: category.featuredReels },
            isActive: true,
            isApproved: true
          })
          .populate('author', 'username profilePicture isVerified')
          .limit(3);
        } else {
          // If no featured reels, get the most recent ones
          featuredReels = await Reel.find({
            category: category.name,
            isActive: true,
            isApproved: true,
            ...((!req.user || !req.user.preferredCategories?.includes('NSFW')) && { isNSFW: { $ne: true } })
          })
          .populate('author', 'username profilePicture isVerified')
          .sort({ createdAt: -1 })
          .limit(3);
        }

        return {
          ...category.toObject(),
          featuredReels: featuredReels.map(reel => ({
            _id: reel._id,
            title: reel.title,
            thumbnailUrl: reel.thumbnailUrl,
            author: reel.author,
            likesCount: reel.likes?.length || 0,
            viewsCount: reel.views?.length || 0
          }))
        };
      })
    );

    res.json({
      success: true,
      data: { categories: categoriesWithReels }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

// @route   GET /api/categories/:slug
// @desc    Get category by slug
// @access  Public (optional auth)
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { sortBy = 'newest' } = req.query;

    // Build filter
    let filter = {
      category: category.name,
      isActive: true,
      isApproved: true
    };

    // Filter NSFW content
    if (!req.user || !req.user.preferredCategories?.includes('NSFW')) {
      filter.isNSFW = { $ne: true };
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'popular':
        sort = { 'likes': -1, 'views': -1 };
        break;
      case 'trending':
        sort = { isTrending: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const reels = await Reel.find(filter)
      .populate('author', 'username profilePicture isVerified')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const reelsWithStats = reels.map(reel => ({
      ...reel,
      likesCount: reel.likes?.length || 0,
      commentsCount: reel.comments?.length || 0,
      sharesCount: reel.shares?.length || 0,
      viewsCount: reel.views?.length || 0,
      isLiked: req.user ? reel.likes?.some(like => like.user.toString() === req.user._id.toString()) : false
    }));

    const totalReels = await Reel.countDocuments(filter);
    const totalPages = Math.ceil(totalReels / limit);

    res.json({
      success: true,
      data: {
        category: {
          ...category.toObject(),
          featuredReels: undefined // Remove featured reels from category object to reduce payload
        },
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
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin only)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('name').isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer')
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

    const { name, description, icon, color, sortOrder } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = new Category({
      name,
      description,
      icon,
      color,
      sortOrder,
      createdBy: req.user._id
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during category creation'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin only)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('name').optional().isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
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

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, icon, color, sortOrder, isActive } = req.body;

    // If name is being changed, check if new name already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
      category.name = name;
    }

    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has reels
    const reelCount = await Reel.countDocuments({ category: category.name, isActive: true });
    
    if (reelCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${reelCount} active reels. Move or delete reels first.`
      });
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category'
    });
  }
});

// @route   POST /api/categories/:id/featured-reels
// @desc    Add reel to category featured reels
// @access  Private (Admin only)
router.post('/:id/featured-reels', [
  authenticateToken,
  requireAdmin,
  body('reelId').isMongoId().withMessage('Invalid reel ID')
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

    const category = await Category.findById(req.params.id);
    const { reelId } = req.body;
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if reel belongs to this category
    if (reel.category !== category.name) {
      return res.status(400).json({
        success: false,
        message: 'Reel does not belong to this category'
      });
    }

    // Add to featured reels if not already there
    if (!category.featuredReels.includes(reelId)) {
      category.featuredReels.push(reelId);
      await category.save();
    }

    res.json({
      success: true,
      message: 'Reel added to featured reels',
      data: { category }
    });

  } catch (error) {
    console.error('Add featured reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding featured reel'
    });
  }
});

// @route   DELETE /api/categories/:id/featured-reels/:reelId
// @desc    Remove reel from category featured reels
// @access  Private (Admin only)
router.delete('/:id/featured-reels/:reelId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    const { reelId } = req.params;
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Remove from featured reels
    category.featuredReels.pull(reelId);
    await category.save();

    res.json({
      success: true,
      message: 'Reel removed from featured reels',
      data: { category }
    });

  } catch (error) {
    console.error('Remove featured reel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing featured reel'
    });
  }
});

module.exports = router;
