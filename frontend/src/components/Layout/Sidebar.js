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

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="fixed left-0 top-0 h-full w-70 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 overflow-y-auto lg:translate-x-0 lg:static lg:z-auto"
      >
        <div className="p-4">
          {/* Logo */}
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
                  onClick={onClose}
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
            <div className="space-y-1">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/category/${category.toLowerCase()}`}
                  className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
