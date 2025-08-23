const cloudinary = require('cloudinary').v2;

// Function to check if a Cloudinary resource exists
const checkCloudinaryResourceExists = async (publicId, resourceType = 'video') => {
  try {
    await cloudinary.api.resource(publicId, { resource_type: resourceType });
    return true;
  } catch (error) {
    if (error.http_code === 404) {
      return false; // Resource doesn't exist
    }
    // For other errors (like rate limits), assume it exists to avoid false positives
    console.warn(`Warning: Could not verify Cloudinary resource ${publicId}:`, error.message);
    return true;
  }
};

// Function to validate and filter reels that have valid Cloudinary videos
const validateReelsCloudinaryVideos = async (reels) => {
  const validReels = [];
  const invalidReelIds = [];

  for (const reel of reels) {
    if (!reel.cloudinaryVideoId) {
      console.warn(`Reel ${reel._id} has no cloudinaryVideoId`);
      invalidReelIds.push(reel._id);
      continue;
    }

    const videoExists = await checkCloudinaryResourceExists(reel.cloudinaryVideoId, 'video');
    if (videoExists) {
      validReels.push(reel);
    } else {
      console.warn(`Video not found in Cloudinary for reel ${reel._id}: ${reel.cloudinaryVideoId}`);
      invalidReelIds.push(reel._id);
    }
  }

  return { validReels, invalidReelIds };
};

// Function to mark reels as inactive if their Cloudinary videos don't exist
const markInvalidReelsInactive = async (invalidReelIds) => {
  if (invalidReelIds.length === 0) return;

  const Reel = require('../models/Reel');
  try {
    const result = await Reel.updateMany(
      { _id: { $in: invalidReelIds } },
      { $set: { isActive: false, inactiveReason: 'Cloudinary video not found' } }
    );
    
    console.log(`Marked ${result.modifiedCount} reels as inactive due to missing Cloudinary videos`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error marking reels as inactive:', error);
    return 0;
  }
};

// Batch validation to avoid hitting API limits
const validateReelsBatch = async (reels, batchSize = 10, delayMs = 100) => {
  const validReels = [];
  const invalidReelIds = [];

  for (let i = 0; i < reels.length; i += batchSize) {
    const batch = reels.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (reel) => {
      if (!reel.cloudinaryVideoId) {
        return { reel: null, isValid: false };
      }

      const videoExists = await checkCloudinaryResourceExists(reel.cloudinaryVideoId, 'video');
      return { reel: videoExists ? reel : null, isValid: videoExists };
    });

    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach((result, index) => {
      const originalReel = batch[index];
      if (result.isValid) {
        validReels.push(originalReel);
      } else {
        invalidReelIds.push(originalReel._id);
      }
    });

    // Add delay between batches to respect API limits
    if (i + batchSize < reels.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { validReels, invalidReelIds };
};

module.exports = {
  checkCloudinaryResourceExists,
  validateReelsCloudinaryVideos,
  markInvalidReelsInactive,
  validateReelsBatch
};
