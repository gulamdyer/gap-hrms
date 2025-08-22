import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-row min-h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="pt-2 px-4 lg:pt-4 lg:px-6 w-full flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 