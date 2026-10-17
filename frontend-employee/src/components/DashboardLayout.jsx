import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getProfile } from '../api';
import { useTaskNotifications } from '../hooks/useTaskNotifications';
import { Bell, ArrowRight, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showPermPrompt, setShowPermPrompt] = useState(false);
  const navigate = useNavigate();

  const { newTasksAlert, dismissAlert, requestPermission } = useTaskNotifications(true);

  useEffect(() => {
    getProfile()
      .then(res => setProfile(res))
      .catch(err => console.error(err));

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowPermPrompt(true);
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setShowPermPrompt(false);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      <Header toggleSidebar={() => setIsSidebarOpen(true)} profile={profile} />
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
      
      {/* Browser Notification Permission Banner */}
      {showPermPrompt && (
        <div style={{
          background: 'linear-gradient(90deg, #1E40AF 0%, #0284C7 100%)',
          color: 'white',
          padding: '0.65rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.85rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} color="#93C5FD" />
            <span>Enable browser notifications to receive instant alerts when a wash task is assigned to you.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleEnableNotifications}
              style={{
                background: 'white',
                color: '#1E40AF',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Turn On
            </button>
            <button
              onClick={() => setShowPermPrompt(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.2rem' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating In-App Alert for Newly Assigned Tasks */}
      {newTasksAlert.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '16px',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '380px',
          width: 'calc(100% - 32px)'
        }}>
          {newTasksAlert.map(task => (
            <div 
              key={task.id}
              style={{
                background: '#0F172A',
                color: 'white',
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                border: '1.5px solid #0EA5E9',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                animation: 'slideDown 0.3s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{
                    background: '#0EA5E9',
                    color: 'white',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    NEW TASK #{task.id}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38BDF8' }}>
                    {task.washType?.name}
                  </span>
                </div>
                <button
                  onClick={() => dismissAlert(task.id)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                Scheduled: <strong>{task.timeSlot}</strong> on {new Date(task.date).toLocaleDateString()}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  onClick={() => {
                    dismissAlert(task.id);
                    navigate('/schedule');
                  }}
                  style={{
                    background: '#0284C7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  View in Assigned Slots <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <main style={{ flex: 1, padding: '1.5rem 1rem', overflowX: 'hidden' }}>
        {React.cloneElement(children, { profile, setProfile })}
      </main>
    </div>
  );
};

export default DashboardLayout;
