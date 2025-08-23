import React, { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../services/api';
import ReelsFeed from '../components/Reels/ReelsFeed';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { FiSearch, FiFilter } from 'react-icons/fi';

const Explore = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories with real counts
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    }
  });

  const categories = categoriesData?.data?.categories || [];

  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality is handled by ReelsFeed component
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Reels
          </h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reels, users, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiFilter />
              </button>
            </div>
          </form>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Browse by Category
          </h2>
          
          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* All Categories Option */}
              <button
                onClick={() => setSelectedCategory('')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedCategory === ''
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎬</div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    All Categories
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    View all reels
                  </p>
                </div>
              </button>

              {/* Dynamic Categories */}
              {categories.map((category) => (
                <button
                  key={category._id || category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{getCategoryEmoji(category.name)}</div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {category.reelsCount || 0} reels
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reels Feed */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {selectedCategory ? `${selectedCategory} Reels` : searchQuery ? `Results for "${searchQuery}"` : 'All Reels'}
          </h2>
          
          <ReelsFeed 
            category={selectedCategory}
            searchQuery={searchQuery}
            key={`${selectedCategory}-${searchQuery}`} // Force re-render when filters change
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to get emoji for category
const getCategoryEmoji = (categoryName) => {
  const emojiMap = {
    'Entertainment': '🎭',
    'Music': '🎵',
    'Dance': '💃',
    'Comedy': '😂',
    'Sports': '⚽',
    'Gaming': '🎮',
    'Food': '🍔',
    'Travel': '✈️',
    'News': '📰',
    'Education': '📚',
    'Technology': '💻',
    'Fashion': '👗',
    'Beauty': '💄',
    'Fitness': '💪',
    'Pets': '🐕',
    'Art': '🎨',
    'DIY': '🔨',
    'Science': '🔬',
    'Nature': '🌿',
    'Photography': '📸'
  };
  return emojiMap[categoryName] || '🎬';
};

export default Explore;
