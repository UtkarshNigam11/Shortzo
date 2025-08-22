const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Reel = require('../models/Reel');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', [
  authenticateToken,
  body('content').isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
  body('reelId').isMongoId().withMessage('Invalid reel ID'),
  body('parentCommentId').optional().isMongoId().withMessage('Invalid parent comment ID')
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

    const { content, reelId, parentCommentId } = req.body;

    // Check if reel exists
    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // If it's a reply, check if parent comment exists
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Create comment
    const comment = new Comment({
      content,
      author: req.user._id,
      reel: reelId,
      parentComment: parentCommentId || null
    });

    // Extract mentions from content
    if (comment._mentionUsernames && comment._mentionUsernames.length > 0) {
      const mentionedUsers = await User.find({
        username: { $in: comment._mentionUsernames }
      }).select('_id');
      
      comment.mentions = mentionedUsers.map(user => user._id);
    }

    await comment.save();

    // Add comment to reel's comments array
    reel.comments.push(comment._id);
    await reel.save();

    // If it's a reply, add to parent comment's replies
    if (parentComment) {
      parentComment.addReply(comment._id);
      await parentComment.save();
    }

    // Populate author info for response
    await comment.populate('author', 'username profilePicture isVerified');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment creation'
    });
  }
});

// @route   GET /api/comments/:reelId
// @desc    Get comments for a reel
// @access  Public
router.get('/:reelId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const comments = await Comment.find({
      reel: req.params.reelId,
      parentComment: null,
      isActive: true
    })
    .populate('author', 'username profilePicture isVerified')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username profilePicture isVerified'
      },
      options: { limit: 3, sort: { createdAt: -1 } } // Show only 3 recent replies
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Add engagement stats
    const commentsWithStats = comments.map(comment => ({
      ...comment.toObject(),
      likesCount: comment.likes.length,
      repliesCount: comment.replies.length
    }));

    const totalComments = await Comment.countDocuments({
      reel: req.params.reelId,
      parentComment: null,
      isActive: true
    });

    const totalPages = Math.ceil(totalComments / limit);

    res.json({
      success: true,
      data: {
        comments: commentsWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalComments,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments'
    });
  }
});

// @route   GET /api/comments/replies/:parentCommentId
// @desc    Get replies for a comment
// @access  Public
router.get('/replies/:parentCommentId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const replies = await Comment.find({
      parentComment: req.params.parentCommentId,
      isActive: true
    })
    .populate('author', 'username profilePicture isVerified')
    .sort({ createdAt: 1 }) // Oldest first for replies
    .skip(skip)
    .limit(limit);

    const repliesWithStats = replies.map(reply => ({
      ...reply.toObject(),
      likesCount: reply.likes.length
    }));

    const totalReplies = await Comment.countDocuments({
      parentComment: req.params.parentCommentId,
      isActive: true
    });

    const totalPages = Math.ceil(totalReplies / limit);

    res.json({
      success: true,
      data: {
        replies: repliesWithStats,
        pagination: {
          currentPage: page,
          totalPages,
          totalReplies,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching replies'
    });
  }
});

// @route   POST /api/comments/:id/like
// @desc    Like/Unlike a comment
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const liked = comment.addLike(req.user._id);
    await comment.save();

    res.json({
      success: true,
      message: liked ? 'Comment liked' : 'Comment unliked',
      data: {
        liked,
        likesCount: comment.likes.length
      }
    });

  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while liking comment'
    });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (author only)
router.put('/:id', [
  authenticateToken,
  body('content').isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
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

    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    // Update comment content
    comment.content = req.body.content;
    
    // Extract mentions from updated content
    if (comment._mentionUsernames && comment._mentionUsernames.length > 0) {
      const mentionedUsers = await User.find({
        username: { $in: comment._mentionUsernames }
      }).select('_id');
      
      comment.mentions = mentionedUsers.map(user => user._id);
    }

    await comment.save();
    await comment.populate('author', 'username profilePicture isVerified');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating comment'
    });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private (author only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Soft delete by setting isActive to false
    comment.isActive = false;
    await comment.save();

    // Remove comment from reel's comments array
    await Reel.findByIdAndUpdate(comment.reel, {
      $pull: { comments: comment._id }
    });

    // If it's a reply, remove from parent comment's replies
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: comment._id }
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting comment'
    });
  }
});

// @route   POST /api/comments/:id/report
// @desc    Report a comment
// @access  Private
router.post('/:id/report', [
  authenticateToken,
  body('reason').isIn(['spam', 'inappropriate', 'harassment', 'hate-speech', 'other']).withMessage('Invalid report reason'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters')
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

    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const { reason, description } = req.body;

    // Check if user already reported this comment
    const existingReport = comment.reports.find(
      report => report.user.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this comment'
      });
    }

    // Add report
    comment.reports.push({
      user: req.user._id,
      reason,
      description
    });

    await comment.save();

    res.json({
      success: true,
      message: 'Comment reported successfully'
    });

  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reporting comment'
    });
  }
});

module.exports = router;
