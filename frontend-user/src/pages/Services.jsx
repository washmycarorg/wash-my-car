import React, { useState, useEffect } from 'react';
import { getCarTypes, getWashTypes, getAllWashPrices } from '../api';
import { Link } from 'react-router-dom';
import { Droplets, Car, CheckCircle, Zap, Star, Shield, Wind } from 'lucide-react';

const WASH_ICONS = {
  default: Droplets,
  basic: Wind,
  standard: Shield,
  full: Star,
  premium: Zap,
};

const WASH_COLORS = [
  { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '#93C5FD', accent: '#2563EB' },
  { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#86EFAC', accent: '#16A34A' },
  { bg: 'linear-gradient(135deg, #FEF9C3, #FEF08A)', border: '#FDE047', accent: '#CA8A04' },
  { bg: 'linear-gradient(135deg, #FDF4FF, #F3E8FF)', border: '#D8B4FE', accent: '#9333EA' },
  { bg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', border: '#FED7AA', accent: '#EA580C' },
];

const WASH_DESCRIPTIONS = {
  basic: [
    'Exterior rinse & dry',
    'Wheel cleaning',
    'Window wipe-down',
    'Tyre shine',
  ],
  standard: [
    'Everything in Basic',
    'Interior vacuum',
    'Dashboard wipe',
    'Door panel cleaning',
  ],
  full: [
    'Everything in Standard',
    'Deep interior shampoo',
    'Seat & carpet clean',
    'Odor treatment',
  ],
  premium: [
    'Everything in Full Detail',
    'Paint protection coat',
    'Engine bay clean',
    'Full wax & polish',
  ],
};

const getWashDesc = (washName) => {
  const name = washName.toLowerCase();
  if (name.includes('basic')) return WASH_DESCRIPTIONS.basic;
  if (name.includes('standard') || name.includes('express')) return WASH_DESCRIPTIONS.standard;
  if (name.includes('full') || name.includes('detail')) return WASH_DESCRIPTIONS.full;
  if (name.includes('premium') || name.includes('ultra')) return WASH_DESCRIPTIONS.premium;
  return ['Professional cleaning service', 'Eco-friendly products', 'Trained technicians', 'Doorstep convenience'];
};

const Services = () => {
  const [carTypes, setCarTypes] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [prices, setPrices] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCarTypes(), getWashTypes(), getAllWashPrices()])
      .then(([cars, washes, priceMatrix]) => {
        setCarTypes(cars);
        setWashTypes(washes);
        setPrices(priceMatrix);
        if (cars.length > 0) setSelectedCar(cars[0].id);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const getPrice = (washTypeId) => {
    if (!selectedCar) return null;
    const entry = prices.find(p => p.carTypeId === selectedCar && p.washTypeId === washTypeId);
    return entry ? entry.price : null;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        Loading services...
      </div>
    </div>
  );

  const selectedCarName = carTypes.find(c => c.id === selectedCar)?.name || '';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 0.4rem', color: 'var(--primary-navy)', fontSize: '1.5rem', fontWeight: 800 }}>
          Our Wash Plans
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Professional doorstep car cleaning — pick your plan and book instantly
        </p>
      </div>

      {/* Car Type Selector */}
      {carTypes.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', textAlign: 'center' }}>
            Select your vehicle type for accurate pricing
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {carTypes.map(ct => (
              <button
                key={ct.id}
                onClick={() => setSelectedCar(ct.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.1rem',
                  borderRadius: '999px',
                  border: selectedCar === ct.id ? '2px solid var(--primary-blue)' : '2px solid #E2E8F0',
                  background: selectedCar === ct.id ? 'var(--primary-blue)' : 'white',
                  color: selectedCar === ct.id ? 'white' : 'var(--primary-navy)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Car size={14} />
                {ct.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plan Cards Grid */}
      {washTypes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Droplets size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--primary-navy)', margin: '0 0 0.5rem' }}>No plans available yet</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Check back soon — we're setting up our service plans.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {washTypes.map((wash, idx) => {
            const color = WASH_COLORS[idx % WASH_COLORS.length];
            const price = getPrice(wash.id);
            const features = getWashDesc(wash.name);
            const Icon = WASH_ICONS[wash.name?.toLowerCase().split(' ')[0]] || Droplets;
            const isPricedForCar = price !== null;

            return (
              <div key={wash.id} style={{
                background: 'white',
                border: `1px solid ${color.border}`,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}>
                {/* Card Header */}
                <div style={{
                  background: color.bg,
                  padding: '1.5rem 1.25rem 1.25rem',
                  borderBottom: `1px solid ${color.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                      <Droplets size={18} color={color.accent} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--primary-navy)' }}>{wash.name}</h3>
                  </div>

                  {isPricedForCar ? (
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: color.accent, lineHeight: 1 }}>
                        ₹{price}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        for {selectedCarName}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Price not set for {selectedCarName}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
                  {wash.description && (
                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{wash.description}</p>
                  )}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <CheckCircle size={14} color={color.accent} style={{ flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
                  <Link
                    to="/book"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      background: isPricedForCar ? color.accent : '#E2E8F0',
                      color: isPricedForCar ? 'white' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                      pointerEvents: isPricedForCar ? 'auto' : 'none',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {isPricedForCar ? 'Book This Plan' : 'Not Available'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom note */}
      <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.25rem', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          🌿 We use <strong>eco-friendly products</strong> &nbsp;|&nbsp; 💧 <strong>Water-efficient</strong> techniques &nbsp;|&nbsp; ⏱ Service in <strong>60–90 minutes</strong>
        </p>
      </div>
    </div>
  );
};

export default Services;
