import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiSettings,
  FiGrid,
  FiBookmark,
  FiHeart,
  FiCalendar,
  FiMapPin,
  FiLink,
  FiMoreVertical,
  FiFlag,
  FiUserPlus,
  FiUserMinus,
  FiEdit3
} from 'react-icons/fi';
import Avatar from '../../components/Common/Avatar';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import ErrorMessage from '../../components/Common/ErrorMessage';
import ReelCard from '../../components/Reels/ReelCard';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('reels');
  const [showMenu, setShowMenu] = useState(false);

  // Fetch user profile
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const response = await api.get(`/users/profile/${username}`);
      return response.data.data;
    }
  });

  // Fetch user's reels
  const { 
    data: reelsData, 
    isLoading: reelsLoading 
  } = useQuery({
    queryKey: ['user-reels', profile?._id],
    queryFn: async () => {
      const response = await api.get(`/reels?userId=${profile._id}`);
      return response.data;
    },
    enabled: !!profile?._id
  });

  // Fetch bookmarked reels (only for current user)
  const { 
    data: bookmarksData, 
    isLoading: bookmarksLoading 
  } = useQuery({
    queryKey: ['user-bookmarks', profile?._id],
    queryFn: async () => {
      const response = await api.get('/users/bookmarks');
      return response.data;
    },
    enabled: !!profile?._id && profile?._id === currentUser?.id && activeTab === 'bookmarks'
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const action = profile.isFollowing ? 'unfollow' : 'follow';
      const response = await api.post(`/users/${profile._id}/${action}`);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['profile', username]);
      
      const previousProfile = queryClient.getQueryData(['profile', username]);
      
      queryClient.setQueryData(['profile', username], old => ({
        ...old,
        isFollowing: !old.isFollowing,
        followersCount: old.isFollowing 
          ? old.followersCount - 1 
          : old.followersCount + 1
      }));
      
      return { previousProfile };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['profile', username], context.previousProfile);
      toast.error('Failed to update follow status');
    },
    onSettled: () => {
      queryClient.invalidateQueries(['profile', username]);
    }
  });

  // Report user mutation
  const reportMutation = useMutation({
    mutationFn: async (reason) => {
      const response = await api.post(`/users/${profile._id}/report`, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('User reported successfully');
      setShowMenu(false);
    },
    onError: () => {
      toast.error('Failed to report user');
    }
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage
          message={profileError.response?.data?.message || 'Failed to load profile'}
          onRetry={refetchProfile}
        />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile?._id;
  const reels = reelsData?.data || [];
  const bookmarks = bookmarksData?.data || [];

  const stats = [
    { label: 'Reels', value: profile?.reelsCount || 0, key: 'reels' },
    { label: 'Followers', value: profile?.followersCount || 0, key: 'followers' },
    { label: 'Following', value: profile?.followingCount || 0, key: 'following' },
  ];

  const tabs = [
    { id: 'reels', label: 'Reels', icon: FiGrid, count: reels.length },
    ...(isOwnProfile ? [{ id: 'bookmarks', label: 'Saved', icon: FiBookmark, count: bookmarks.length }] : []),
    ...(isOwnProfile ? [{ id: 'likes', label: 'Liked', icon: FiHeart, count: profile?.likedReelsCount || 0 }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 px-6 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <Avatar
              src={profile?.avatar}
              alt={profile?.username}
              size="xl"
              className="flex-shrink-0"
            />

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.username}
                </h1>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {isOwnProfile ? (
                    <button
                      onClick={() => navigate('/settings')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <FiEdit3 className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isLoading}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          profile?.isFollowing
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {followMutation.isLoading ? (
                          <LoadingSpinner size="small" color={profile?.isFollowing ? 'gray' : 'white'} />
                        ) : profile?.isFollowing ? (
                          <>
                            <FiUserMinus className="h-4 w-4" />
                            <span>Unfollow</span>
                          </>
                        ) : (
                          <>
                            <FiUserPlus className="h-4 w-4" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(!showMenu)}
                          className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          <FiMoreVertical className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                          {showMenu && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[150px] z-10"
                            >
                              <button
                                onClick={() => reportMutation.mutate('inappropriate')}
                                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <FiFlag className="h-4 w-4" />
                                <span>Report User</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md mx-auto md:mx-0">
                  {profile.bio}
                </p>
              )}

              {/* Profile Details */}
              <div className="flex flex-wrap items-center justify-center md:justify-start space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <FiCalendar className="h-4 w-4" />
                  <span>Joined {formatDistanceToNow(new Date(profile?.createdAt), { addSuffix: true })}</span>
                </div>
                
                {profile?.location && (
                  <div className="flex items-center space-x-1">
                    <FiMapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}

                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <FiLink className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start space-x-8">
                {stats.map((stat) => (
                  <button
                    key={stat.key}
                    className="text-center hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (stat.key === 'reels') setActiveTab('reels');
                    }}
                  >
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'reels' && (
            <div>
              {reelsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : reels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reels.map((reel) => (
                    <div key={reel._id} className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                      <ReelCard reel={reel} isActive={false} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiGrid className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No reels yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {isOwnProfile
                      ? "Upload your first reel to get started!"
                      : `${profile?.username} hasn't uploaded any reels yet.`}
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate('/upload')}
                      className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Upload Reel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div>
              {bookmarksLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookmarks.map((reel) => (
                    <div key={reel._id} className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                      <ReelCard reel={reel} isActive={false} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiBookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No saved reels
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Reels you bookmark will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="text-center py-12">
              <FiHeart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Liked reels are private
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Only you can see the reels you've liked.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
