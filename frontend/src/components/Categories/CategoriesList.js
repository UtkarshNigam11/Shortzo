import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiMusic,
  FiSmile,
  FiActivity,
  FiMonitor,
  FiHeart,
  FiMapPin,
  FiFilm,
  FiStar,
  FiBriefcase,
  FiCamera,
  FiHome,
  FiMoreHorizontal
} from 'react-icons/fi';

const CategoriesList = ({ onCategoryChange, selectedCategory }) => {
  const location = useLocation();

  const categories = [
    { name: 'All', icon: FiHome, color: 'bg-gray-500', slug: '', count: 0 },
    { name: 'Entertainment', icon: FiFilm, color: 'bg-red-500', slug: 'entertainment', count: 145 },
    { name: 'Music', icon: FiMusic, color: 'bg-purple-500', slug: 'music', count: 892 },
    { name: 'Dance', icon: FiActivity, color: 'bg-pink-500', slug: 'dance', count: 267 },
    { name: 'Comedy', icon: FiSmile, color: 'bg-yellow-500', slug: 'comedy', count: 423 },
    { name: 'Sports', icon: FiTrendingUp, color: 'bg-green-500', slug: 'sports', count: 156 },
    { name: 'Gaming', icon: FiMonitor, color: 'bg-blue-500', slug: 'gaming', count: 334 },
    { name: 'Food', icon: FiHeart, color: 'bg-orange-500', slug: 'food', count: 189 },
    { name: 'Travel', icon: FiMapPin, color: 'bg-indigo-500', slug: 'travel', count: 278 },
    { name: 'Fashion', icon: FiStar, color: 'bg-rose-500', slug: 'fashion', count: 412 },
    { name: 'Education', icon: FiBriefcase, color: 'bg-teal-500', slug: 'education', count: 89 },
    { name: 'Art', icon: FiCamera, color: 'bg-violet-500', slug: 'art', count: 134 },
    { name: 'Technology', icon: FiBriefcase, color: 'bg-cyan-500', slug: 'technology', count: 67 },
    { name: 'Other', icon: FiMoreHorizontal, color: 'bg-gray-400', slug: 'other', count: 203 }
  ];

  const handleCategoryClick = (category) => {
    if (onCategoryChange) {
      onCategoryChange(category.slug);
    }
  };

  return (
    <div className="space-y-2">
      {categories.map((category, index) => {
        const Icon = category.icon;
        const isActive = selectedCategory === category.slug || 
          (selectedCategory === '' && category.slug === '');
        
        return (
          <motion.div
            key={category.slug}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => handleCategoryClick(category)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${category.color} ${
                isActive ? 'shadow-md' : 'opacity-80 group-hover:opacity-100'
              } transition-all duration-200`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{category.name}</div>
                {category.count > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {category.count.toLocaleString()} reels
                  </div>
                )}
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="w-2 h-2 bg-indigo-500 rounded-full"
                />
              )}
            </button>
          </motion.div>
        );
      })}
      
      {/* Trending Tags */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Trending Tags
        </h3>
        <div className="space-y-2">
          {['viral', 'trending', 'fyp', 'challenge', 'funny'].map((tag, index) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (categories.length * 0.05) + (index * 0.1) }}
            >
              <Link
                to={`/explore?tag=${tag}`}
                className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                #{tag}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesList;
