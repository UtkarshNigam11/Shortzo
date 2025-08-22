import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ReelCard from './ReelCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { api } from '../../utils/api';
import { FiFilter, FiX } from 'react-icons/fi';

const ReelsFeed = ({ 
  category = null, 
  userId = null, 
  showNSFW = false, 
  searchQuery = '', 
  tags = [] 
}) => {
  const [sortBy, setSortBy] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [activeReel, setActiveReel] = useState(0);
  const feedRef = useRef(null);
  const reelRefs = useRef({});

  // Fetch reels with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['reels', { category, userId, showNSFW, searchQuery, tags, sortBy }],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam,
        limit: 10,
        sortBy,
        ...(category && { category }),
        ...(userId && { userId }),
        ...(showNSFW !== undefined && { showNSFW }),
        ...(searchQuery && { search: searchQuery }),
        ...(tags.length > 0 && { tags: tags.join(',') })
      });

      const response = await api.get(`/reels?${params}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten reels data
  const reels = data?.pages?.flatMap(page => page.data) || [];

  // Intersection Observer for auto-play
  useEffect(() => {
    const observers = [];
    
    Object.keys(reelRefs.current).forEach(reelId => {
      const reelElement = reelRefs.current[reelId];
      if (reelElement) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              const index = reels.findIndex(reel => reel._id === reelId);
              setActiveReel(index);
            }
          },
          { threshold: 0.7 }
        );
        observer.observe(reelElement);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [reels]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        feedRef.current &&
        feedRef.current.scrollTop + feedRef.current.clientHeight >= 
        feedRef.current.scrollHeight - 1000 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    const feedElement = feedRef.current;
    if (feedElement) {
      feedElement.addEventListener('scroll', handleScroll);
      return () => feedElement.removeEventListener('scroll', handleScroll);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' && activeReel > 0) {
        const prevReelId = reels[activeReel - 1]._id;
        reelRefs.current[prevReelId]?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowDown' && activeReel < reels.length - 1) {
        const nextReelId = reels[activeReel + 1]._id;
        reelRefs.current[nextReelId]?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReel, reels]);

  const sortOptions = [
    { value: 'latest', label: 'Latest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'most-liked', label: 'Most Liked' },
    { value: 'most-viewed', label: 'Most Viewed' },
    { value: 'trending', label: 'Trending' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        message={error?.message || 'Failed to load reels'}
        onRetry={refetch}
      />
    );
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No reels found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {searchQuery
            ? `No reels match your search "${searchQuery}"`
            : category
            ? `No reels in "${category}" category yet`
            : 'Be the first to upload a reel!'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Filters Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {category ? `${category} Reels` : 'All Reels'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {reels.length} reels
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <FiFilter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Filters</h4>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Add more filter options here */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration
                  </label>
                  <select className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700">
                    <option>Any duration</option>
                    <option>Under 30s</option>
                    <option>30s - 1min</option>
                    <option>Over 1min</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reels Feed */}
      <div
        ref={feedRef}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        <div className="space-y-4 p-4">
          {reels.map((reel, index) => (
            <div
              key={reel._id}
              ref={el => reelRefs.current[reel._id] = el}
              className="min-h-screen snap-start"
            >
              <ReelCard
                reel={reel}
                isActive={index === activeReel}
                onReelChange={(newIndex) => setActiveReel(newIndex)}
              />
            </div>
          ))}

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* No more reels indicator */}
          {!hasNextPage && reels.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                You've reached the end! 🎉
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReelsFeed;
