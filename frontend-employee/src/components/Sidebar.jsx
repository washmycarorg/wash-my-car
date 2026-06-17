import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Wallet, FileText, User, LogOut, X, Droplets } from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Assigned Slots', path: '/schedule', icon: CalendarCheck },
    { name: 'Earnings', path: '/earnings', icon: Wallet },
    { name: 'Leaves', path: '/leaves', icon: FileText },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 45
          }}
        />
      )}

      {/* Drawer */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: '280px',
        background: '#025EBA', // Blue theme
        color: 'white',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        display: 'flex', flexDirection: 'column',
        boxShadow: isOpen ? '4px 0 10px rgba(0,0,0,0.1)' : 'none'
      }}>
        <div style={{padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
           <div className="flex items-center gap-3">
             <div style={{background: 'white', padding: '0.25rem', borderRadius: '0.5rem'}}>
               <Droplets size={24} color="#025EBA" />
             </div>
             <div>
               <h2 style={{color: 'white', fontSize: '1.1rem', margin: 0, fontWeight: 700, letterSpacing: '1px'}}>PRO <span style={{color: 'var(--accent-teal)'}}>WASH</span></h2>
               <p style={{fontSize: '0.65rem', margin: 0, opacity: 0.8}}>Employee Portal</p>
             </div>
           </div>
           <button onClick={closeSidebar} style={{background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem'}}>
             <X size={24} />
           </button>
        </div>

        <nav style={{flex: 1, padding: '1rem 0', overflowY: 'auto'}}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = path === link.path;
            return (
              <Link key={link.path} to={link.path} onClick={closeSidebar} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.5rem', color: 'white', textDecoration: 'none',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderLeft: isActive ? '4px solid white' : '4px solid transparent',
                fontSize: '1.05rem'
              }}>
                <Icon size={22} style={{opacity: isActive ? 1 : 0.8}} />
                <span style={{opacity: isActive ? 1 : 0.9, fontWeight: isActive ? 500 : 400}}>{link.name}</span>
              </Link>
            );
          })}

          <button 
            onClick={() => { localStorage.removeItem('employeeToken'); window.location.href = '/'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1.5rem', color: 'white', textDecoration: 'none',
              background: 'transparent', border: 'none', borderLeft: '4px solid transparent',
              width: '100%', cursor: 'pointer', fontSize: '1.05rem', marginTop: '2rem'
            }}
          >
            <LogOut size={22} style={{opacity: 0.8}} />
            <span style={{opacity: 0.9}}>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
