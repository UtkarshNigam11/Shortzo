import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Import pages we've created
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Upload from './pages/Upload/Upload';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import Explore from './pages/Explore';
import Trending from './pages/Trending';
import Liked from './pages/Liked';
import Saved from './pages/Saved';

// Placeholder component for pages not yet created
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-gray-600 dark:text-gray-400">Page not found</p>
    </div>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="large" />
            </div>
          }
        >
          <Routes>
            {/* Auth Routes - No Layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Routes with Layout */}
            <Route path="/*" element={
              <Layout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  
                  {/* Protected Routes */}
                  <Route 
                    path="/upload" 
                    element={
                      <ProtectedRoute>
                        <Upload />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/liked" 
                    element={
                      <ProtectedRoute>
                        <Liked />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/saved" 
                    element={
                      <ProtectedRoute>
                        <Saved />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
