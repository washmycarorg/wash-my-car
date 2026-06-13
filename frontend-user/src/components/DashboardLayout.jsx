import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getProfile } from '../api';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile()
      .then(res => setProfile(res))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)'}}>
      <Header toggleSidebar={() => setIsSidebarOpen(true)} profile={profile} />
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
      
      <main style={{flex: 1, padding: '1.5rem 1rem', overflowX: 'hidden'}}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
