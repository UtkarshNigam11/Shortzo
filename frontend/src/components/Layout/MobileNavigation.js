import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiCompass,
  FiUpload,
  FiHeart,
  FiUser
} from 'react-icons/fi';

const MobileNavigation = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: FiHome, label: 'Home', path: '/', showWhenLoggedOut: true },
    { icon: FiCompass, label: 'Explore', path: '/explore', showWhenLoggedOut: true },
    { icon: FiUpload, label: 'Upload', path: '/upload', showWhenLoggedOut: false },
    { icon: FiHeart, label: 'Liked', path: '/liked', showWhenLoggedOut: false },
    { 
      icon: FiUser, 
      label: 'Profile', 
      path: user ? `/profile/${user.username}` : '/login', 
      showWhenLoggedOut: true 
    },
  ];

  const visibleItems = navItems.filter(item => item.showWhenLoggedOut || user);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-30 lg:hidden">
      <div className="flex justify-around py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 min-w-[60px] transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className={`p-1 ${item.path === '/upload' ? 'bg-indigo-600 rounded-lg' : ''}`}>
                <Icon 
                  className={`h-6 w-6 ${item.path === '/upload' ? 'text-white' : ''}`} 
                />
              </div>
              <span className={`text-xs mt-1 ${item.path === '/upload' ? 'text-indigo-600 font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;
