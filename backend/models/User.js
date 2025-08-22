const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [160, 'Bio cannot exceed 160 characters'],
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel'
  }],
  likedReels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel'
  }],
  savedReels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel'
  }],
  preferredCategories: [{
    type: String,
    enum: ['Infotainment', 'Entertainment', 'News', 'Music', 'Dance', 'Makeup', 'Beauty', 'Edits', 'Comedy', 'Sports', 'Food', 'Travel', 'Education', 'Technology']
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better search performance
userSchema.index({ username: 1, email: 1 });
userSchema.index({ preferredCategories: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    profilePicture: this.profilePicture,
    bio: this.bio,
    followers: this.followers.length,
    following: this.following.length,
    reelsCount: this.reels.length,
    isVerified: this.isVerified,
    joinedAt: this.joinedAt
  };
};

// Virtual for followers count
userSchema.virtual('followersCount').get(function() {
  return this.followers.length;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

// Virtual for reels count
userSchema.virtual('reelsCount').get(function() {
  return this.reels.length;
});

module.exports = mongoose.model('User', userSchema);
