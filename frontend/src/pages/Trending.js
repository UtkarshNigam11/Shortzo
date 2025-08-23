import React, { useState } from 'react';
import ReelsFeed from '../components/Reels/ReelsFeed';
import { FiTrendingUp, FiClock, FiEye } from 'react-icons/fi';

const Trending = () => {
  const [timeRange, setTimeRange] = useState('today');

  const timeRanges = [
    { id: 'today', label: 'Today', icon: FiClock },
    { id: 'week', label: 'This Week', icon: FiTrendingUp },
    { id: 'month', label: 'This Month', icon: FiEye },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FiTrendingUp className="text-3xl text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Trending Reels
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Discover the most popular reels right now
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {timeRanges.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTimeRange(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  timeRange === id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <Icon className="text-sm" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Views
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  2.4M
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FiEye className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Trending Videos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  156
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FiTrendingUp className="text-green-600 dark:text-green-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  45K
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FiClock className="text-purple-600 dark:text-purple-400 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Trending Reels */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Most Popular Right Now
          </h2>
          
          <ReelsFeed 
            sortBy="trending"
            showTrending={true}
            key={timeRange} // Force re-render when time range changes
          />
        </div>
      </div>
    </div>
  );
};

export default Trending;
