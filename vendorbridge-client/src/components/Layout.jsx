import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Global Page Layout Wrapper Component
 * Sidebar on the left, Navbar at top, scrollable content panel on the right.
 */
const Layout = ({ children, pageTitle }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9FAFB] text-[#111827]">
      {/* Sidebar navigation panel */}
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main view container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <Navbar
          pageTitle={pageTitle}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto bg-[#F9FAFB]">
          <div className="mx-auto max-w-[1400px] px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
