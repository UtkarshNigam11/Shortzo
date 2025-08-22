import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from 'react-query';
import { api } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiBookmark,
  FiMoreVertical,
  FiFlag,
  FiEye,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX
} from 'react-icons/fi';
import Avatar from '../Common/Avatar';
import LoadingSpinner from '../Common/LoadingSpinner';

const ReelCard = ({ reel, isActive, onReelChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const playerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(reel.isBookmarked);
  const [showMenu, setShowMenu] = useState(false);

  // Auto-play when active
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      // Mark as viewed
      markAsViewed.mutate();
    } else {
      setIsPlaying(false);
    }
  }, [isActive]);

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/reels/${reel._id}/${isLiked ? 'unlike' : 'like'}`);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['reels']);
      setIsLiked(!isLiked);
    },
    onError: (error) => {
      setIsLiked(isLiked);
      toast.error('Failed to update like');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reels']);
    }
  });

  // Bookmark/Unbookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/reels/${reel._id}/${isBookmarked ? 'unbookmark' : 'bookmark'}`);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['reels']);
      setIsBookmarked(!isBookmarked);
    },
    onError: (error) => {
      setIsBookmarked(isBookmarked);
      toast.error('Failed to update bookmark');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reels']);
    }
  });

  // Mark as viewed mutation
  const markAsViewed = useMutation({
    mutationFn: async () => {
      await api.post(`/reels/${reel._id}/view`);
    },
    onError: (error) => {
      console.error('Failed to mark reel as viewed:', error);
    }
  });

  // Report reel mutation
  const reportMutation = useMutation({
    mutationFn: async (reason) => {
      const response = await api.post(`/reels/${reel._id}/report`, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Reel reported successfully');
      setShowMenu(false);
    },
    onError: (error) => {
      toast.error('Failed to report reel');
    }
  });

  const handleLike = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    bookmarkMutation.mutate();
  };

  const handleShare = async () => {
    const shareData = {
      title: `${reel.user.username}'s reel on Shortzo`,
      text: reel.description || 'Check out this awesome reel!',
      url: `${window.location.origin}/reel/${reel._id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareData.url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleReport = (reason) => {
    reportMutation.mutate(reason);
  };

  const handleProgress = ({ played, playedSeconds }) => {
    setProgress(played);
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    playerRef.current?.seekTo(pos);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-screen bg-black rounded-lg overflow-hidden group">
      {/* Video Player */}
      <ReactPlayer
        ref={playerRef}
        url={reel.videoUrl}
        playing={isPlaying}
        muted={isMuted}
        loop
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onDuration={handleDuration}
        onReady={() => setIsPlaying(isActive)}
        className="absolute inset-0"
        config={{
          file: {
            attributes: {
              style: { objectFit: 'cover' }
            }
          }
        }}
      />

      {/* Overlay Controls */}
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={() => setIsPlaying(!isPlaying)}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {!isPlaying && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="bg-black bg-opacity-50 rounded-full p-4"
          >
            <FiPlay className="h-12 w-12 text-white" />
          </motion.div>
        )}

        {/* Progress Bar */}
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-4 right-20"
          >
            <div 
              className="h-1 bg-gray-600 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-white text-xs mt-1">
              <span>{formatTime(progress * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* User Info and Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex justify-between items-end">
          {/* User Info and Description */}
          <div className="flex-1 mr-4 text-white">
            <Link
              to={`/profile/${reel.user.username}`}
              className="flex items-center space-x-3 mb-2 hover:opacity-80"
            >
              <Avatar
                src={reel.user.avatar}
                alt={reel.user.username}
                size="medium"
                className="ring-2 ring-white"
              />
              <div>
                <h3 className="font-semibold">{reel.user.username}</h3>
                <p className="text-sm text-gray-300">
                  {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
                </p>
              </div>
            </Link>

            {reel.description && (
              <p className="text-sm mb-2 line-clamp-3">{reel.description}</p>
            )}

            {/* Tags */}
            {reel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {reel.tags.slice(0, 3).map((tag, index) => (
                  <Link
                    key={index}
                    to={`/explore?tag=${tag}`}
                    className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full hover:bg-opacity-30 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
                {reel.tags.length > 3 && (
                  <span className="text-xs text-gray-300">
                    +{reel.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Category */}
            {reel.category && (
              <Link
                to={`/category/${reel.category}`}
                className="inline-block text-xs bg-indigo-500 bg-opacity-80 px-2 py-1 rounded-full hover:bg-opacity-100 transition-colors"
              >
                {reel.category}
              </Link>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-4">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={likeMutation.isLoading}
              className={`flex flex-col items-center space-y-1 group ${
                isLiked ? 'text-red-500' : 'text-white'
              }`}
            >
              {likeMutation.isLoading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <FiHeart 
                  className={`h-6 w-6 transition-transform group-hover:scale-110 ${
                    isLiked ? 'fill-current' : ''
                  }`} 
                />
              )}
              <span className="text-xs">{reel.likesCount}</span>
            </button>

            {/* Comment */}
            <Link
              to={`/reel/${reel._id}`}
              className="flex flex-col items-center space-y-1 text-white group"
            >
              <FiMessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
              <span className="text-xs">{reel.commentsCount}</span>
            </Link>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center space-y-1 text-white group"
            >
              <FiShare2 className="h-6 w-6 transition-transform group-hover:scale-110" />
              <span className="text-xs">Share</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              disabled={bookmarkMutation.isLoading}
              className={`flex flex-col items-center space-y-1 group ${
                isBookmarked ? 'text-yellow-500' : 'text-white'
              }`}
            >
              {bookmarkMutation.isLoading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <FiBookmark 
                  className={`h-6 w-6 transition-transform group-hover:scale-110 ${
                    isBookmarked ? 'fill-current' : ''
                  }`} 
                />
              )}
              <span className="text-xs">Save</span>
            </button>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex flex-col items-center space-y-1 text-white group"
              >
                <FiMoreVertical className="h-6 w-6 transition-transform group-hover:scale-110" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[150px]"
                >
                  <button
                    onClick={() => handleReport('inappropriate')}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiFlag className="h-4 w-4" />
                    <span>Report</span>
                  </button>
                  <Link
                    to={`/reel/${reel._id}`}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiEye className="h-4 w-4" />
                    <span>View Details</span>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Volume Control */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
      >
        {isMuted ? <FiVolumeX className="h-5 w-5" /> : <FiVolume2 className="h-5 w-5" />}
      </button>

      {/* Views Count */}
      <div className="absolute top-4 left-4 flex items-center space-x-1 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded-full">
        <FiEye className="h-4 w-4" />
        <span>{reel.viewsCount}</span>
      </div>
    </div>
  );
};

export default ReelCard;
