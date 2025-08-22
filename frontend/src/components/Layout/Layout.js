import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';

const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <Header />
      
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block lg:w-64 lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:overflow-y-auto">
          <Sidebar />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-16 pb-16 lg:pb-0">
          {children}
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
};

export default Layout;
