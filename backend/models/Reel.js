const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  cloudinaryVideoId: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  cloudinaryThumbnailId: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // Duration in seconds
    required: [true, 'Video duration is required']
  },
  fileSize: {
    type: Number, // File size in bytes
    required: [true, 'File size is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Infotainment', 'Entertainment', 'News', 'Music', 'Dance', 'Makeup', 'Beauty', 'Edits', 'Comedy', 'Sports', 'Food', 'Travel', 'Education', 'Technology']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
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
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    platform: {
      type: String,
      enum: ['internal', 'facebook', 'twitter', 'instagram', 'whatsapp', 'copy-link']
    }
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    watchTime: {
      type: Number, // in seconds
      default: 0
    }
  }],
  isNSFW: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: true // Auto-approve for now
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'copyright', 'violence', 'harassment', 'misinformation', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  quality: {
    type: String,
    enum: ['360p', '720p', '1080p'],
    default: '720p'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
reelSchema.index({ category: 1, isActive: 1 });
reelSchema.index({ tags: 1 });
reelSchema.index({ author: 1 });
reelSchema.index({ uploadedAt: -1 });
reelSchema.index({ 'likes.user': 1 });
reelSchema.index({ isTrending: 1, isActive: 1 });
reelSchema.index({ isNSFW: 1 });

// Virtual for likes count
reelSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comments count
reelSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Virtual for shares count
reelSchema.virtual('sharesCount').get(function() {
  return this.shares.length;
});

// Virtual for views count
reelSchema.virtual('viewsCount').get(function() {
  return this.views.length;
});

// Method to add a like
reelSchema.methods.addLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());
  
  if (likeIndex === -1) {
    this.likes.push({ user: userId });
    return true; // Added like
  } else {
    this.likes.splice(likeIndex, 1);
    return false; // Removed like
  }
};

// Method to add a view
reelSchema.methods.addView = function(userId, watchTime = 0) {
  // Don't count multiple views from the same user within 24 hours
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentView = this.views.find(view => 
    view.user.toString() === userId.toString() && 
    view.viewedAt > twentyFourHoursAgo
  );
  
  if (!recentView) {
    this.views.push({ user: userId, watchTime });
    return true;
  }
  
  return false;
};

// Method to get engagement score (for trending algorithm)
reelSchema.methods.getEngagementScore = function() {
  const now = new Date();
  const hoursAgo24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Recent interactions count more
  const recentLikes = this.likes.filter(like => like.likedAt > hoursAgo24).length;
  const recentViews = this.views.filter(view => view.viewedAt > hoursAgo24).length;
  const recentShares = this.shares.filter(share => share.sharedAt > hoursAgo24).length;
  const recentComments = this.comments.length; // Comments don't have timestamps in this reference
  
  // Weighted engagement score
  return (recentViews * 1) + (recentLikes * 3) + (recentComments * 5) + (recentShares * 7);
};

// Pre-save middleware to update trending status
reelSchema.pre('save', function(next) {
  const engagementScore = this.getEngagementScore();
  this.isTrending = engagementScore > 50; // Threshold for trending
  next();
});

module.exports = mongoose.model('Reel', reelSchema);
