import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  allowOther = true,
  otherLabel = '+ Other (Enter custom)',
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    const label = typeof opt === 'string' ? opt : opt.label || opt.name;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getDisplayLabel = () => {
    if (!value) return placeholder;
    if (value === '__OTHER__') return 'Other (Manual Entry)';
    const found = options.find(opt => (typeof opt === 'string' ? opt === value : (opt.value || opt.name) === value));
    if (found) return typeof found === 'string' ? found : found.label || found.name;
    return value;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          padding: '0.75rem 1rem',
          border: error ? '1.5px solid #EF4444' : isOpen ? '1.5px solid var(--primary-blue)' : '1px solid #CBD5E1',
          borderRadius: '10px',
          background: disabled ? '#F8FAFC' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.92rem',
          color: value ? 'var(--primary-navy)' : 'var(--text-muted)',
          fontWeight: value ? 600 : 400,
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'none',
          transition: 'all 0.2s',
          userSelect: 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
          {getDisplayLabel()}
        </span>
        <ChevronDown 
          size={16} 
          color="var(--text-muted)" 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.2s',
            flexShrink: 0 
          }} 
        />
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
          zIndex: 999,
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          maxHeight: '260px'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: '#F1F5F9',
            borderRadius: '8px',
            padding: '0 0.6rem'
          }}>
            <Search size={14} color="#64748B" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                color: 'var(--primary-navy)'
              }}
            />
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {filteredOptions.map((opt, idx) => {
              const optVal = typeof opt === 'string' ? opt : (opt.value || opt.name);
              const optLabel = typeof opt === 'string' ? opt : (opt.label || opt.name);
              const isSelected = value === optVal;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    onChange(optVal);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--primary-blue)' : 'var(--text-main)',
                    background: isSelected ? '#EFF6FF' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{optLabel}</span>
                  {isSelected && <Check size={14} color="var(--primary-blue)" />}
                </div>
              );
            })}

            {filteredOptions.length === 0 && (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No matches found
              </div>
            )}

            {/* Other option */}
            {allowOther && (
              <div
                onClick={() => {
                  onChange('__OTHER__');
                  setIsOpen(false);
                }}
                style={{
                  borderTop: '1px solid #F1F5F9',
                  marginTop: '0.25rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: value === '__OTHER__' ? 700 : 600,
                  color: 'var(--primary-blue)',
                  background: value === '__OTHER__' ? '#EFF6FF' : '#F8FAFC',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{otherLabel}</span>
                {value === '__OTHER__' && <Check size={14} color="var(--primary-blue)" />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
