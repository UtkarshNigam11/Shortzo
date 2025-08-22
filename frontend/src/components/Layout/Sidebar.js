import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiCompass,
  FiTrendingUp,
  FiHeart,
  FiBookmark,
  FiUser,
  FiSettings,
  FiUpload
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const categories = [
    'Entertainment',
    'Music',
    'Dance',
    'Comedy',
    'Sports',
    'Gaming',
    'Food',
    'Travel'
  ];

  const menuItems = [
    { icon: FiHome, label: 'Home', path: '/' },
    { icon: FiCompass, label: 'Explore', path: '/explore' },
    { icon: FiTrendingUp, label: 'Trending', path: '/trending' },
    ...(user ? [
      { icon: FiHeart, label: 'Liked', path: '/liked' },
      { icon: FiBookmark, label: 'Saved', path: '/saved' },
      { icon: FiUser, label: 'Profile', path: `/profile/${user.username}` },
      { icon: FiSettings, label: 'Settings', path: '/settings' }
    ] : [])
  ];

  // Desktop Sidebar Content
  const SidebarContent = () => (
    <div className="p-4">
      {/* Logo - Only show on mobile */}
      <Link to="/" className="flex items-center space-x-2 mb-8 lg:hidden">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white">Shortzo</span>
      </Link>

      {/* Upload Button */}
      {user && (
        <Link
          to="/upload"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 mb-6 transition-colors"
          onClick={() => onClose && onClose()}
        >
          <FiUpload className="h-4 w-4" />
          <span>Upload Reel</span>
        </Link>
      )}

      {/* Navigation Menu */}
      <nav className="space-y-2 mb-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => onClose && onClose()}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Categories
        </h3>
        <div className="space-y-2">
          {[
            { name: 'All', icon: '🏠', slug: '', count: 0 },
            { name: 'Entertainment', icon: '🎬', slug: 'entertainment', count: 145 },
            { name: 'Music', icon: '🎵', slug: 'music', count: 892 },
            { name: 'Dance', icon: '💃', slug: 'dance', count: 267 },
            { name: 'Comedy', icon: '😄', slug: 'comedy', count: 423 },
            { name: 'Sports', icon: '⚽', slug: 'sports', count: 156 },
            { name: 'Gaming', icon: '🎮', slug: 'gaming', count: 334 },
            { name: 'Food', icon: '🍕', slug: 'food', count: 189 },
            { name: 'Travel', icon: '✈️', slug: 'travel', count: 278 }
          ].map((category) => {
            const isActive = location.pathname === `/category/${category.slug}`;
            return (
              <Link
                key={category.slug}
                to={category.slug ? `/category/${category.slug}` : '/'}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => onClose && onClose()}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                {category.count > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {category.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Trending Tags */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Trending
          </h4>
          <div className="space-y-1">
            {['viral', 'trending', 'fyp'].map((tag) => (
              <Link
                key={tag}
                to={`/explore?tag=${tag}`}
                className="block px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                onClick={() => onClose && onClose()}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      {typeof isOpen !== 'undefined' ? (
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: isOpen ? 0 : -280 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed left-0 top-0 h-full w-70 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 overflow-y-auto lg:hidden"
        >
          <SidebarContent />
        </motion.div>
      ) : (
        /* Desktop Sidebar - Static */
        <div className="h-full bg-white dark:bg-gray-800 overflow-y-auto">
          <SidebarContent />
        </div>
      )}
    </>
  );
};

export default Sidebar;
