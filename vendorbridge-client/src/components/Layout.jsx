import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Global Page Layout Wrapper Component
 * Sidebar on the left, Navbar at top, scrollable content panel on the right.
 *
 * Props:
 *   children  {ReactNode} — Page content
 *   pageTitle {string}    — Passed to Navbar to display current page (optional)
 */
const Layout = ({ children, pageTitle }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-950">
      {/* Sidebar navigation panel */}
      <Sidebar />

      {/* Main view container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar pageTitle={pageTitle} />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
