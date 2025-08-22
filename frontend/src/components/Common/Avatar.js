import React from 'react';
import { FiUser } from 'react-icons/fi';

const Avatar = ({ 
  src, 
  alt, 
  size = 'medium', 
  className = '', 
  fallbackIcon = FiUser,
  onClick,
  isOnline = false
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const FallbackIcon = fallbackIcon;

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback */}
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 ${src ? 'hidden' : 'flex'}`}
        style={{ display: src ? 'none' : 'flex' }}
      >
        <FallbackIcon className={iconSizes[size]} />
      </div>

      {/* Online indicator */}
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
      )}
    </div>
  );
};

export default Avatar;
