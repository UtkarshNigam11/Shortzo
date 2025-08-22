import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiPlay, FiUsers, FiTrendingUp, FiUpload } from 'react-icons/fi';
import ReelsFeed from '../components/Reels/ReelsFeed';
import CategoriesList from '../components/Categories/CategoriesList';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {!user && (
        <section className="relative bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white py-20">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
                Welcome to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  Shortzo
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto animate-slide-up">
                Discover, create, and share amazing short video reels across multiple categories. 
                Join millions of creators and viewers in the ultimate short video experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  to="/register"
                  className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-full transition-colors duration-200 flex items-center justify-center"
                >
                  <FiPlay className="mr-2" />
                  Get Started
                </Link>
                <Link
                  to="/explore"
                  className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 font-semibold py-3 px-8 rounded-full transition-colors duration-200 flex items-center justify-center"
                >
                  <FiTrendingUp className="mr-2" />
                  Explore Reels
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="animate-slide-up">
                  <div className="text-3xl font-bold mb-2">1M+</div>
                  <div className="text-gray-300">Active Users</div>
                </div>
                <div className="animate-slide-up">
                  <div className="text-3xl font-bold mb-2">10M+</div>
                  <div className="text-gray-300">Video Reels</div>
                </div>
                <div className="animate-slide-up">
                  <div className="text-3xl font-bold mb-2">14</div>
                  <div className="text-gray-300">Categories</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Categories
              </h2>
              <CategoriesList />
              
              {user && (
                <div className="mt-8 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
                  <h3 className="font-semibold mb-2">Share Your Story</h3>
                  <p className="text-sm mb-4 text-indigo-100">
                    Upload your first reel and start building your audience!
                  </p>
                  <Link
                    to="/upload"
                    className="bg-white text-indigo-600 hover:bg-gray-100 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <FiUpload className="mr-2 h-4 w-4" />
                    Upload Reel
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            {user ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Your Feed
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <FiUsers className="h-4 w-4" />
                    <span>Personalized for you</span>
                  </div>
                </div>
                <ReelsFeed />
              </>
            ) : (
              <>
                {/* Features Section */}
                <section className="py-16">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      Why Choose Shortzo?
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Experience the next generation of short video sharing with powerful features
                      designed for creators and viewers alike.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <FiPlay className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                        Diverse Content
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Explore content across 14+ categories including Entertainment, Education, Music, Dance, and more.
                      </p>
                    </div>

                    <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <FiUsers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                        Community Driven
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Connect with like-minded creators and viewers. Build your following and engage with content you love.
                      </p>
                    </div>

                    <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
                      <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <FiTrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                        Smart Discovery
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Advanced tagging and personalized recommendations help you discover content tailored to your interests.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Trending Reels Preview */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Trending Now
                    </h2>
                    <Link
                      to="/explore"
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  <ReelsFeed showTrending={true} limit={6} />
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
