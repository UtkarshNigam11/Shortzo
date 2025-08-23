import React from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';
import ReelCard from '../components/Reels/ReelCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Liked = () => {
  const { user } = useAuth();

  // Fetch liked reels
  const { 
    data: likedReels, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['liked-reels'],
    queryFn: async () => {
      const response = await api.get('/users/liked-reels');
      return response.data;
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Liked Reels
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error.message || 'Failed to load your liked reels'}
          </p>
        </div>
      </div>
    );
  }

  const reels = likedReels?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FiHeart className="text-3xl text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Liked Reels
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            All the reels you've liked
          </p>
        </div>

        {/* Reels Grid */}
        {reels.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No Liked Reels Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start liking reels to see them here!
            </p>
            <button
              onClick={() => window.location.href = '/explore'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Explore Reels
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {reels.length} liked reel{reels.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {reels.map((reel) => (
                <ReelCard
                  key={reel._id}
                  reel={reel}
                  compact={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Liked;
