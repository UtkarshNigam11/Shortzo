import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUpload,
  FiX,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiImage,
  FiVideo,
  FiTag,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      isNSFW: false,
      allowComments: true,
      allowDownload: false
    }
  });

  const watchedCategory = watch('category');
  const watchedIsNSFW = watch('isNSFW');

  // Fetch categories
  const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    }
  });

  // Ensure categories is always an array
  const categories = Array.isArray(categoriesResponse?.data?.categories) 
    ? categoriesResponse.data.categories 
    : Array.isArray(categoriesResponse?.data) 
    ? categoriesResponse.data 
    : Array.isArray(categoriesResponse) 
    ? categoriesResponse 
    : [];

  // Debug logging
  React.useEffect(() => {
    console.log('Categories Debug:', {
      categoriesResponse,
      categories,
      categoriesLoading,
      categoriesError
    });
  }, [categoriesResponse, categories, categoriesLoading, categoriesError]);

  // Fallback categories if API fails (matching backend validation)
  const fallbackCategories = [
    { _id: 'entertainment', name: 'Entertainment' },
    { _id: 'music', name: 'Music' },
    { _id: 'dance', name: 'Dance' },
    { _id: 'comedy', name: 'Comedy' },
    { _id: 'sports', name: 'Sports' },
    { _id: 'food', name: 'Food' },
    { _id: 'travel', name: 'Travel' },
    { _id: 'education', name: 'Education' },
    { _id: 'technology', name: 'Technology' },
    { _id: 'infotainment', name: 'Infotainment' },
    { _id: 'news', name: 'News' },
    { _id: 'makeup', name: 'Makeup' },
    { _id: 'beauty', name: 'Beauty' },
    { _id: 'edits', name: 'Edits' }
  ];

  const finalCategories = (categories && categories.length > 0) ? categories : fallbackCategories;

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/reels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 150000, // 150 seconds timeout for video uploads
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
          
          // Show processing message when upload completes but request is still pending
          if (progress === 100) {
            setTimeout(() => {
              setUploadProgress(101); // Use 101 to indicate processing phase
            }, 500);
          }
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Reel uploaded successfully!');
      console.log('Upload success data:', data);
      // Navigate to home page where user can see their uploaded reel
      navigate('/');
    },
    onError: (error) => {
      console.error('Upload error:', error.response?.data);
      
      if (error.response?.data?.errors) {
        // Show specific validation errors
        error.response.data.errors.forEach(err => {
          toast.error(`${err.param}: ${err.msg}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Upload failed');
      }
      setUploadProgress(0);
    }
  });

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File size must be less than 500MB');
      return;
    }

    setSelectedFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setCurrentStep(2);
  }, []);

  const handleThumbnailSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setSelectedThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }, []);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data) => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      toast.error('Title is required');
      return;
    }

    if (!data.category) {
      toast.error('Category is required');
      return;
    }

    // Calculate video duration if possible
    const getDuration = () => {
      return new Promise((resolve) => {
        if (videoPreview && selectedFile) {
          const video = document.createElement('video');
          video.src = videoPreview;
          video.onloadedmetadata = () => {
            resolve(Math.round(video.duration) || 30); // Round to integer
          };
          video.onerror = () => resolve(30); // fallback
        } else {
          resolve(30); // fallback
        }
      });
    };

    const duration = await getDuration();

    const formData = new FormData();
    formData.append('video', selectedFile);
    if (selectedThumbnail) {
      formData.append('thumbnail', selectedThumbnail);
    }
    formData.append('title', data.title.trim());
    formData.append('description', data.description?.trim() || '');
    formData.append('category', data.category);
    formData.append('tags', JSON.stringify(tags || []));
    formData.append('isNSFW', data.isNSFW ? 'true' : 'false');
    formData.append('allowComments', data.allowComments !== false ? 'true' : 'false');
    formData.append('allowDownload', data.allowDownload !== false ? 'true' : 'false');
    formData.append('duration', duration.toString());

    console.log('Form data being sent:', {
      title: data.title.trim(),
      description: data.description?.trim() || '',
      category: data.category,
      tags: tags,
      isNSFW: data.isNSFW,
      duration: duration,
      hasVideo: !!selectedFile,
      hasThumbnail: !!selectedThumbnail
    });

    uploadMutation.mutate(formData);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setVideoPreview(null);
    setThumbnailPreview(null);
    setCurrentStep(1);
    setTags([]);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to upload</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">Upload New Reel</h1>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-white' : 'text-white/60'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-white text-indigo-600' : 'bg-white/20'}`}>
                  1
                </div>
                <span>Select Video</span>
              </div>
              <div className="w-12 h-px bg-white/40"></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-white' : 'text-white/60'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-white text-indigo-600' : 'bg-white/20'}`}>
                  2
                </div>
                <span>Add Details</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 hover:border-indigo-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select Video File
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Choose a video file from your device (Max: 500MB)
                  </p>
                  <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-center space-x-2">
                    <FiVideo className="h-4 w-4" />
                    <span>MP4, WebM, AVI supported</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <FiUpload className="h-4 w-4" />
                    <span>Max file size: 500MB</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <FiPlay className="h-4 w-4" />
                    <span>Recommended: 9:16 aspect ratio</span>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Video Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Video Preview
                  </h3>
                  
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-sm mx-auto">
                    {videoPreview && (
                      <>
                        <video
                          src={videoPreview}
                          className="w-full h-full object-cover"
                          loop
                          muted={isMuted}
                          ref={(ref) => {
                            if (ref) {
                              if (isPlaying) {
                                ref.play().catch(() => {});
                              } else {
                                ref.pause();
                              }
                            }
                          }}
                        />
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="bg-black bg-opacity-50 rounded-full p-3 text-white hover:bg-opacity-70"
                          >
                            {isPlaying ? <FiPause className="h-6 w-6" /> : <FiPlay className="h-6 w-6" />}
                          </button>
                        </div>

                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
                        >
                          {isMuted ? <FiVolumeX className="h-4 w-4" /> : <FiVolume2 className="h-4 w-4" />}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={resetUpload}
                    className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Select Different Video
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        {...register('title', { required: 'Title is required' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter a catchy title..."
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Describe your reel..."
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category *
                      </label>
                      <select
                        {...register('category', { required: 'Category is required' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select a category</option>
                        {finalCategories.map(category => (
                          <option key={category._id || category.name} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                      )}
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tags
                      </label>
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleTagKeyPress}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter tags..."
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <FiTag className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                            >
                              <span>#{tag}</span>
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100"
                              >
                                <FiX className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Custom Thumbnail (Optional)
                      </label>
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FiImage className="h-4 w-4" />
                          <span>Choose Thumbnail</span>
                        </button>
                        {thumbnailPreview && (
                          <div className="relative">
                            <img
                              src={thumbnailPreview}
                              alt="Thumbnail preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedThumbnail(null);
                                setThumbnailPreview(null);
                                if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isNSFW"
                          {...register('isNSFW')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isNSFW" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 flex items-center space-x-1">
                          {watchedIsNSFW ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                          <span>Mark as NSFW (18+)</span>
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="allowComments"
                          {...register('allowComments')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allowComments" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                          Allow comments
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="allowDownload"
                          {...register('allowDownload')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allowDownload" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                          Allow downloads
                        </label>
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {uploadMutation.isLoading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            {uploadProgress > 100 ? 'Processing video...' : 'Uploading...'}
                          </span>
                          <span>
                            {uploadProgress > 100 ? 'Please wait' : `${uploadProgress}%`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              uploadProgress > 100 
                                ? 'bg-yellow-500 animate-pulse' 
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: uploadProgress > 100 ? '100%' : `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={uploadMutation.isLoading || !isValid}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {uploadMutation.isLoading ? (
                        <>
                          <LoadingSpinner size="small" color="white" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <FiUpload className="h-4 w-4" />
                          <span>Upload Reel</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
