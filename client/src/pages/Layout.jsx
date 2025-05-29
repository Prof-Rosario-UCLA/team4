import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import OfflineFallback from '../components/OfflineFallback.jsx';
import { useNetworkStatus } from "../hooks/useNetworkStatus.jsx";


const Layout = () => {
  const isOnline = useNetworkStatus();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    console.log("SET ", isSidebarOpen)
  } 

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-100 border-r border-gray-200">
        <div className="p-4 font-bold text-lg">Sidebar</div>
        {/* Add sidebar content here */}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-14 flex items-center bg-white border-b border-gray-200 shadow-xs sticky top-0 z-10">
          <Navbar toggleSidebar={toggleSidebar}/>
        </header>

        {/* Content */}
        {/* The outlet represents all children component inside it*/}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white items-center justify-content pt-1 px-5">
          {isOnline ? <Outlet /> : <OfflineFallback />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
