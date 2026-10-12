import React from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/wash my car.png';

const Header = ({ toggleSidebar, profile }) => {
  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : 'R';
  const name = profile?.name || 'Rahul Mehta';

  return (
    <header style={{
      background: 'white', 
      padding: '0.85rem 1rem', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      position: 'sticky', 
      top: 0, 
      zIndex: 40,
      boxShadow: '0 2px 8px rgba(13, 38, 80, 0.04)'
    }}>
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={toggleSidebar} 
          style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center'}}
          aria-label="Open navigation menu"
        >
          <Menu size={24} color="var(--primary-navy)" />
        </button>

        <Link to="/dashboard" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <img src={logo} alt="Wash My Car Logo" style={{height: '32px', width: 'auto', objectFit: 'contain'}} />
          <div style={{display: 'flex', alignItems: 'baseline', gap: '0.35rem', flexWrap: 'nowrap'}}>
            <span style={{
              fontSize: '1.15rem', 
              fontWeight: 900, 
              letterSpacing: '0.04em',
              lineHeight: 1
            }}>
              <span style={{color: 'var(--primary-navy)'}}>WASH </span>
              <span style={{color: 'var(--accent-teal)'}}>MY </span>
              <span style={{color: 'var(--primary-navy)'}}>CAR</span>
            </span>
            <span style={{
              color: 'var(--accent-teal)',
              fontSize: '1.05rem',
              fontWeight: 900,
              letterSpacing: '0.06em',
              lineHeight: 1
            }}>
              ORG
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div style={{textAlign: 'right'}} className="hidden sm:block">
          <p style={{fontWeight: 600, fontSize: '0.9rem', margin: 0, color: 'var(--primary-navy)'}}>{name}</p>
          <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0}}>User</p>
        </div>
        <Link to="/profile" style={{
          width: 40, height: 40, 
          borderRadius: '50%', 
          background: 'var(--primary-blue)', 
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
          boxShadow: '0 2px 6px rgba(21, 101, 192, 0.25)'
        }}>
          {initial}
        </Link>
      </div>
    </header>
  );
};

export default Header;
