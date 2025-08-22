const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required']
  },
  reel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel',
    required: [true, 'Reel reference is required']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // null for top-level comments
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'hate-speech', 'other']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
commentSchema.index({ reel: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });

// Virtual for likes count
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for replies count
commentSchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Method to add a like
commentSchema.methods.addLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());
  
  if (likeIndex === -1) {
    this.likes.push({ user: userId });
    return true; // Added like
  } else {
    this.likes.splice(likeIndex, 1);
    return false; // Removed like
  }
};

// Method to add a reply
commentSchema.methods.addReply = function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
  }
};

// Pre-save middleware to extract mentions
commentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract @mentions from content
    const mentionPattern = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionPattern.exec(this.content)) !== null) {
      mentions.push(match[1]);
    }
    
    // Store mention usernames (will need to resolve to user IDs in the controller)
    this._mentionUsernames = mentions;
    this.isEdited = !this.isNew;
    
    if (this.isEdited) {
      this.editedAt = new Date();
    }
  }
  
  next();
});

module.exports = mongoose.model('Comment', commentSchema);
