import React from 'react';
import { Menu } from 'lucide-react';

const Header = ({ toggleSidebar, profile }) => {
  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : 'S';
  const name = profile?.name || 'Suresh Kumar';

  return (
    <header style={{
      background: 'white', 
      padding: '1rem', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      position: 'sticky', 
      top: 0, 
      zIndex: 40
    }}>
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem'}}>
          <Menu size={24} color="var(--primary-navy)" />
        </button>
        <h2 style={{color: 'var(--primary-navy)', fontSize: '1.25rem', margin: 0, fontWeight: 600}}>Employee Portal</h2>
      </div>

      <div className="flex items-center gap-3">
        <div style={{textAlign: 'right'}} className="hidden sm:block">
          <p style={{fontWeight: 600, fontSize: '0.9rem', margin: 0, color: 'var(--primary-navy)'}}>{name}</p>
          <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0}}>Employee</p>
        </div>
        <div style={{
          width: 40, height: 40, 
          borderRadius: '50%', 
          background: 'var(--primary-blue)', 
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: '1.1rem'
        }}>
          {initial}
        </div>
      </div>
    </header>
  );
};

export default Header;
