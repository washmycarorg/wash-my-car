import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarCheck, CalendarDays, Droplets, Car, 
  Gift, User, LogOut, X, Crown, Headphones 
} from 'lucide-react';

import logo from '../assets/wash my car.png';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'VIP Pass & Club', path: '/subscriptions', icon: Crown },
    { name: 'Book Slot', path: '/book', icon: CalendarCheck },
    { name: 'My Bookings', path: '/bookings', icon: CalendarDays },
    { name: 'Services', path: '/services', icon: Droplets },
    { name: 'Saved Cars', path: '/cars', icon: Car },
    { name: 'Rewards', path: '/rewards', icon: Gift },
    { name: 'Support', path: '/support', icon: Headphones },
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
        width: '320px',
        maxWidth: '88vw',
        background: '#025EBA', // Exact blue from screenshot
        color: 'white',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        display: 'flex', flexDirection: 'column',
        boxShadow: isOpen ? '4px 0 16px rgba(0,0,0,0.2)' : 'none'
      }}>
        {/* Header with clean separation so close button never overlaps brand text */}
        <div style={{
          padding: '1.25rem 1rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          borderBottom: '1px solid rgba(255,255,255,0.12)'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
             <div style={{
                background: 'white',
                padding: '2px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <img src={logo} alt="Wash My Car Logo" style={{width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.15)'}} />
             </div>
             <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
               <h2 style={{
                 color: 'white',
                 fontSize: '0.86rem',
                 margin: 0,
                 fontWeight: 800,
                 letterSpacing: '0.3px',
                 whiteSpace: 'nowrap',
                 lineHeight: 1.2,
                 overflow: 'hidden',
                 textOverflow: 'ellipsis',
                 display: 'flex',
                 alignItems: 'baseline',
                 gap: '0.25rem'
               }}>
                 <span>WASH <span style={{color: 'var(--accent-teal)'}}>MY</span> CAR</span>
                 <span style={{color: 'var(--accent-teal)'}}>ORG</span>
               </h2>
               <p style={{
                 fontSize: '0.62rem',
                 margin: '2px 0 0 0',
                 opacity: 0.85,
                 whiteSpace: 'nowrap',
                 overflow: 'hidden',
                 textOverflow: 'ellipsis'
               }}>
                 Your Car, Cleaned At Your Door.
               </p>
             </div>
           </div>

           <button 
             onClick={closeSidebar} 
             aria-label="Close menu"
             style={{
               background: 'rgba(255, 255, 255, 0.15)',
               border: '1px solid rgba(255, 255, 255, 0.25)',
               borderRadius: '8px',
               color: 'white',
               cursor: 'pointer',
               width: '32px',
               height: '32px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               flexShrink: 0,
               transition: 'background 0.2s ease'
             }}
             onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
             onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
           >
             <X size={18} />
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
            onClick={() => { localStorage.removeItem('userToken'); window.location.href = '/'; }}
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
