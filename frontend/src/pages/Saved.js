import React from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';
import ReelCard from '../components/Reels/ReelCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { FiBookmark } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Saved = () => {
  const { user } = useAuth();

  // Fetch saved reels
  const { 
    data: savedReels, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['saved-reels'],
    queryFn: async () => {
      const response = await api.get('/users/bookmarks');
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
            Error Loading Saved Reels
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error.message || 'Failed to load your saved reels'}
          </p>
        </div>
      </div>
    );
  }

  const reels = savedReels?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FiBookmark className="text-3xl text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Saved Reels
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Reels you've saved for later
          </p>
        </div>

        {/* Reels Grid */}
        {reels.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📌</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No Saved Reels Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Save reels to watch them later!
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
                {reels.length} saved reel{reels.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
                <select className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1">
                  <option>Recently Saved</option>
                  <option>Oldest First</option>
                  <option>Most Popular</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {reels.map((reel) => (
                <ReelCard
                  key={reel._id}
                  reel={reel}
                  compact={true}
                  showSaveButton={false} // Don't show save button since they're already saved
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;
