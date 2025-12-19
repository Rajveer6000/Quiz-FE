/**
 * Layout Component
 * Main layout wrapper with sidebar and content area
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="min-h-screen p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
