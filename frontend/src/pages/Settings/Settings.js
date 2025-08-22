import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiLock,
  FiMail,
  FiImage,
  FiEye,
  FiEyeOff,
  FiSave,
  FiTrash2,
  FiCamera,
  FiX,
  FiBell,
  FiShield,
  FiGlobe
} from 'react-icons/fi';
import Avatar from '../../components/Common/Avatar';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  // Profile form
  const profileForm = useForm({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
    }
  });

  // Password form
  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Privacy form
  const privacyForm = useForm({
    defaultValues: {
      isPrivate: user?.isPrivate || false,
      allowComments: user?.allowComments !== false,
      allowMessages: user?.allowMessages !== false,
      showEmail: user?.showEmail || false,
      showOnlineStatus: user?.showOnlineStatus !== false,
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      if (selectedAvatar) {
        formData.append('avatar', selectedAvatar);
      }

      const response = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data.data);
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      passwordForm.reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  });

  // Update privacy settings mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/privacy', data);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data.data);
      toast.success('Privacy settings updated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update privacy settings');
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/users/account');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      logout();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  });

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };

  const handlePrivacySubmit = (data) => {
    updatePrivacyMutation.mutate(data);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      deleteAccountMutation.mutate();
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'privacy', label: 'Privacy', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <p className="text-white/80 mt-1">Manage your profile and account preferences</p>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-r border-gray-200 dark:border-gray-700">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
                  
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                    {/* Avatar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Profile Picture
                      </label>
                      <div className="flex items-center space-x-4">
                        <Avatar
                          src={avatarPreview || user?.avatar}
                          alt={user?.username}
                          size="xl"
                        />
                        <div className="space-y-2">
                          <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2">
                            <FiCamera className="h-4 w-4" />
                            <span>Change Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarSelect}
                              className="hidden"
                            />
                          </label>
                          {(avatarPreview || selectedAvatar) && (
                            <button
                              type="button"
                              onClick={() => {
                                setAvatarPreview(null);
                                setSelectedAvatar(null);
                              }}
                              className="block text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          {...profileForm.register('username', { required: 'Username is required' })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                        {profileForm.formState.errors.username && (
                          <p className="mt-1 text-sm text-red-600">
                            {profileForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          {...profileForm.register('email', { required: 'Email is required' })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                        {profileForm.formState.errors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {profileForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bio
                      </label>
                      <textarea
                        {...profileForm.register('bio')}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          {...profileForm.register('location')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Your location"
                        />
                      </div>

                      {/* Website */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          {...profileForm.register('website')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={updateProfileMutation.isLoading}
                      className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {updateProfileMutation.isLoading ? (
                        <>
                          <LoadingSpinner size="small" color="white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FiSave className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
                  
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
                    
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? (
                            <FiEyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <FiEye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            {...passwordForm.register('newPassword', { 
                              required: 'New password is required',
                              minLength: { value: 8, message: 'Password must be at least 8 characters' }
                            })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showNewPassword ? (
                              <FiEyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <FiEye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordForm.formState.errors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...passwordForm.register('confirmPassword', { required: 'Please confirm your new password' })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showConfirmPassword ? (
                              <FiEyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <FiEye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {passwordForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={changePasswordMutation.isLoading}
                      className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {changePasswordMutation.isLoading ? (
                        <>
                          <LoadingSpinner size="small" color="white" />
                          <span>Changing...</span>
                        </>
                      ) : (
                        <>
                          <FiLock className="h-4 w-4" />
                          <span>Change Password</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteAccountMutation.isLoading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {deleteAccountMutation.isLoading ? (
                          <>
                            <LoadingSpinner size="small" color="white" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <FiTrash2 className="h-4 w-4" />
                            <span>Delete Account</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy Settings</h2>
                  
                  <form onSubmit={privacyForm.handleSubmit(handlePrivacySubmit)} className="space-y-6">
                    <div className="space-y-4">
                      {/* Private Account */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Private Account</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Only approved followers can see your content
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...privacyForm.register('isPrivate')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Allow Comments */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Allow Comments</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Allow others to comment on your reels
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...privacyForm.register('allowComments')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Allow Messages */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Allow Messages</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Allow others to send you direct messages
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...privacyForm.register('allowMessages')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Show Email */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Show Email</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Display your email address on your profile
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...privacyForm.register('showEmail')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Show Online Status */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Show Online Status</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Show when you're online to other users
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          {...privacyForm.register('showOnlineStatus')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={updatePrivacyMutation.isLoading}
                      className="w-full md:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {updatePrivacyMutation.isLoading ? (
                        <>
                          <LoadingSpinner size="small" color="white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FiSave className="h-4 w-4" />
                          <span>Save Privacy Settings</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive email notifications for new followers, likes, and comments
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive push notifications on your device
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Marketing Emails</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive promotional emails and updates about new features
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
