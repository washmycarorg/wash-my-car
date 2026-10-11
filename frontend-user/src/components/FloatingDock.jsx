import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Car, Sparkles, Gift, Menu } from 'lucide-react';

const FloatingDock = ({ onOpenMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <nav 
      aria-label="Bottom Navigation"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 'calc(100% - 24px)',
        maxWidth: '460px',
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '32px',
        padding: '6px 10px 4px 10px',
        boxShadow: '0 20px 45px -8px rgba(15, 23, 42, 0.22), 0 8px 20px -4px rgba(15, 23, 42, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2px'
      }}
    >
      {/* 1. Bookings */}
      <button
        type="button"
        onClick={() => navigate('/bookings')}
        style={{
          background: isCurrent('/bookings') ? '#F0F9FF' : 'transparent',
          border: 'none',
          borderRadius: '18px',
          color: isCurrent('/bookings') ? '#0284C7' : '#64748B',
          padding: '8px 4px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          fontSize: '0.7rem',
          fontWeight: isCurrent('/bookings') ? 700 : 600,
          transition: 'all 0.2s ease',
          flex: 1,
          minWidth: 0
        }}
      >
        <Calendar size={20} strokeWidth={isCurrent('/bookings') ? 2.4 : 1.9} color={isCurrent('/bookings') ? '#0284C7' : '#64748B'} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>Bookings</span>
      </button>

      {/* 2. My Cars */}
      <button
        type="button"
        onClick={() => navigate('/cars')}
        style={{
          background: isCurrent('/cars') ? '#F0F9FF' : 'transparent',
          border: 'none',
          borderRadius: '18px',
          color: isCurrent('/cars') ? '#0284C7' : '#64748B',
          padding: '8px 4px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          fontSize: '0.7rem',
          fontWeight: isCurrent('/cars') ? 700 : 600,
          transition: 'all 0.2s ease',
          flex: 1,
          minWidth: 0
        }}
      >
        <Car size={20} strokeWidth={isCurrent('/cars') ? 2.4 : 1.9} color={isCurrent('/cars') ? '#0284C7' : '#64748B'} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>My Cars</span>
      </button>

      {/* 3. Center Highlight: Elevated Circular Floating Action Button (FAB) */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          top: '-18px',
          padding: '0 4px',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/book')}
          aria-label="Book Wash"
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
            border: '4px solid #FFFFFF',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isCurrent('/book')
              ? '0 0 0 3px rgba(2, 132, 199, 0.35), 0 10px 24px rgba(2, 132, 199, 0.55)'
              : '0 8px 20px -2px rgba(2, 132, 199, 0.45), 0 4px 10px rgba(6, 182, 212, 0.25)',
            transform: isCurrent('/book') ? 'scale(1.06)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <Sparkles size={22} color="white" strokeWidth={2.5} />
        </button>
        <span style={{
          fontSize: '0.66rem',
          fontWeight: 800,
          color: isCurrent('/book') ? '#0284C7' : 'var(--primary-navy)',
          marginTop: '3px',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap'
        }}>
          Book Wash
        </span>
      </div>

      {/* 4. Rewards */}
      <button
        type="button"
        onClick={() => navigate('/rewards')}
        style={{
          background: isCurrent('/rewards') ? '#F0F9FF' : 'transparent',
          border: 'none',
          borderRadius: '18px',
          color: isCurrent('/rewards') ? '#0284C7' : '#64748B',
          padding: '8px 4px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          fontSize: '0.7rem',
          fontWeight: isCurrent('/rewards') ? 700 : 600,
          transition: 'all 0.2s ease',
          flex: 1,
          minWidth: 0
        }}
      >
        <Gift size={20} strokeWidth={isCurrent('/rewards') ? 2.4 : 1.9} color={isCurrent('/rewards') ? '#0284C7' : '#64748B'} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>Rewards</span>
      </button>

      {/* 5. Menu */}
      <button
        type="button"
        onClick={onOpenMenu}
        style={{
          background: 'transparent',
          border: 'none',
          borderRadius: '18px',
          color: '#64748B',
          padding: '8px 4px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          fontSize: '0.7rem',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          flex: 1,
          minWidth: 0
        }}
      >
        <Menu size={20} strokeWidth={1.9} color="#64748B" />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>Menu</span>
      </button>
    </nav>
  );
};

export default FloatingDock;
