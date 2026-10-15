import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, Check, Sparkles, Car, Gift, Shield, 
  Calendar, ArrowRight, Zap, RefreshCw, AlertCircle, 
  ChevronRight, Star, Clock, CheckCircle2 
} from 'lucide-react';
import { 
  getSubscriptionPlans, 
  getMySubscriptions, 
  subscribeToPlan, 
  verifySubscriptionPayment, 
  getCarTypes, 
  getSettings 
} from '../api';

const Subscriptions = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [selectedCarTypeId, setSelectedCarTypeId] = useState(null);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, plansRes, mySubsRes, carTypesRes] = await Promise.all([
        getSettings().catch(() => ({ subscriptionsEnabled: true })),
        getSubscriptionPlans().catch(() => ({ subscriptionsEnabled: true, plans: [] })),
        getMySubscriptions().catch(() => ({ activeSubscription: null, history: [] })),
        getCarTypes().catch(() => [])
      ]);

      const isEnabled = settingsRes?.subscriptionsEnabled !== undefined ? settingsRes.subscriptionsEnabled : true;
      setSubscriptionsEnabled(isEnabled);

      const loadedPlans = Array.isArray(plansRes?.plans) ? plansRes.plans : (Array.isArray(plansRes) ? plansRes : []);
      setPlans(loadedPlans);

      setMySubscription(mySubsRes?.activeSubscription || null);
      setSubscriptionHistory(mySubsRes?.history || []);

      const validCarTypes = Array.isArray(carTypesRes) ? carTypesRes : [];
      setCarTypes(validCarTypes);

      if (validCarTypes.length > 0 && !selectedCarTypeId) {
        setSelectedCarTypeId(validCarTypes[0].id);
      }
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      setErrorMsg('Failed to load subscriptions. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubscribe = async (plan) => {
    setSubscribingPlanId(plan.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await subscribeToPlan(plan.id);

      if (res.requiresPayment && res.rzpOrder) {
        // Dynamically load Razorpay SDK if not present
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          }).catch(() => null);
        }

        if (!window.Razorpay) {
          alert('Payment gateway failed to load. Please try again.');
          setSubscribingPlanId(null);
          return;
        }

        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const rzpOptions = {
          key: res.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: res.rzpOrder.amount,
          currency: res.rzpOrder.currency || 'INR',
          name: 'Wash My Car VIP Club',
          description: `${plan.name} (${plan.durationLabel})`,
          order_id: res.rzpOrder.id,
          prefill: {
            name: userInfo?.name || '',
            contact: userInfo?.phone || '',
            email: userInfo?.email || ''
          },
          theme: {
            color: '#D97706'
          },
          handler: async function (paymentResponse) {
            try {
              await verifySubscriptionPayment({
                subscriptionId: res.subscription.id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature
              });

              setSuccessMsg(`Congratulations! Welcome to the VIP Club. Your ${plan.name} is now ACTIVE!`);
              loadData();
            } catch (vErr) {
              setErrorMsg(vErr.message || 'Payment verification failed');
            } finally {
              setSubscribingPlanId(null);
            }
          },
          modal: {
            ondismiss: function () {
              setSubscribingPlanId(null);
              setErrorMsg('Subscription checkout was cancelled. You have not been charged.');
            }
          }
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.open();
      } else {
        // Direct / Free / Completed
        setSuccessMsg(`Congratulations! Your ${plan.name} is now ACTIVE!`);
        loadData();
        setSubscribingPlanId(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not complete subscription. Please try again.');
      setSubscribingPlanId(null);
    }
  };

  if (!subscriptionsEnabled) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FEF3C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: '#D97706'
          }}>
            <Crown size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.75rem' }}>
            VIP Subscriptions Temporarily Paused
          </h2>
          <p style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
            Our monthly VIP passes are currently undergoing exciting upgrades. All existing member benefits remain active. You can still book standard doorstep vehicle detailing slots anytime!
          </p>
          <button
            onClick={() => navigate('/book')}
            style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: 'white',
              border: 'none',
              padding: '0.85rem 2rem',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            Book a Doorstep Wash
          </button>
        </div>
      </div>
    );
  }

  const filteredPlans = plans.filter(p => {
    if (!selectedCarTypeId) return true;
    return p.carTypeId === Number(selectedCarTypeId);
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.25rem 1rem 5rem 1rem' }}>
      
      {/* 1. HERO BANNER */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #2E1065 100%)',
        padding: '2.5rem 2rem',
        color: 'white',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.4)',
        marginBottom: '2rem'
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '220px',
          height: '220px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#FCD34D',
            padding: '5px 14px',
            borderRadius: '30px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: '1rem'
          }}>
            <Crown size={15} color="#FBBF24" /> WASH MY CAR VIP PASS
          </div>

          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            lineHeight: 1.15,
            margin: '0 0 0.85rem 0',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Showroom Shine Every Month. <br />
            <span style={{
              background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Zero Booking Friction.
            </span>
          </h1>

          <p style={{
            fontSize: '0.98rem',
            color: '#CBD5E1',
            lineHeight: 1.6,
            margin: '0 0 1.5rem 0'
          }}>
            Join our exclusive VIP membership club. Enjoy up to 40% savings on regular doorstep vehicle spas, free premium add-ons (Bike wash, sanitization & visor polish), and priority arrival slots!
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} color="white" strokeWidth={3} />
              </div>
              4 Doorstep Washes Included
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={13} color="white" />
              </div>
              Free Premium Add-ons
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={13} color="white" />
              </div>
              Priority Slot Dispatch
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{
          background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
          color: '#166534',
          border: '1.5px solid #86EFAC',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          boxShadow: '0 8px 20px rgba(22, 101, 52, 0.12)'
        }}>
          <CheckCircle2 size={26} color="#15803D" />
          <div style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem' }}>
            {successMsg}
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>{errorMsg}</div>
        </div>
      )}

      {/* 2. ACTIVE MEMBERSHIP CARD (If user has one) */}
      {mySubscription && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #F59E0B 100%)',
          borderRadius: '20px',
          padding: '1.5rem 1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 15px 35px -8px rgba(245, 158, 11, 0.4)',
          border: '2px solid #FBBF24',
          color: '#78350F'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: '#78350F',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FEF3C7'
              }}>
                <Crown size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#92400E' }}>
                  YOUR CURRENT VIP MEMBERSHIP
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#451A03' }}>
                  {mySubscription.plan?.name || 'VIP Member Pass'}
                </div>
              </div>
            </div>

            <span style={{
              background: '#FFFFFF',
              color: '#15803D',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid #86EFAC'
            }}>
              ● ACTIVE MEMBER
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(10px)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.6)'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Washes Remaining</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#451A03' }}>
                {mySubscription.washesRemaining} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>/ {mySubscription.washesTotal}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Free Add-ons Available</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#451A03' }}>
                {mySubscription.freeAddonsRemaining} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>/ {mySubscription.freeAddonsTotal}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Valid Until</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#451A03' }}>
                {new Date(mySubscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/book')}
                style={{
                  background: '#78350F',
                  color: 'white',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(69, 26, 3, 0.25)'
                }}
              >
                Book Wash Now <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. VEHICLE TYPE SELECTOR TABS */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Select Your Vehicle Type
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              Customized doorstep spa passes tailored for your exact car class.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {carTypes.map(ct => {
            const isSelected = selectedCarTypeId === ct.id;
            return (
              <button
                key={ct.id}
                onClick={() => setSelectedCarTypeId(ct.id)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid #D97706' : '1.5px solid #E2E8F0',
                  background: isSelected ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : '#FFFFFF',
                  color: isSelected ? '#92400E' : '#475569',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 6px 16px rgba(245, 158, 11, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Car size={18} color={isSelected ? '#D97706' : '#64748B'} />
                {ct.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SUBSCRIPTION PLANS GRID */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw className="animate-spin" size={32} color="#D97706" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 600 }}>Loading VIP Passes...</div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div style={{
          background: '#F8FAFC',
          borderRadius: '20px',
          border: '1.5px dashed #CBD5E1',
          padding: '3rem 2rem',
          textAlign: 'center',
          color: '#64748B'
        }}>
          <Crown size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#1E293B' }}>No Plans Available for this Vehicle</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Please select another vehicle type or check back later.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {filteredPlans.map(plan => {
            let parsedFeatures = [];
            try {
              parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
            } catch (e) {
              parsedFeatures = [plan.features];
            }

            const isSubscribing = subscribingPlanId === plan.id;
            const isBestValue = (plan.badge || '').toUpperCase().includes('POPULAR') || (plan.badge || '').toUpperCase().includes('BEST');

            return (
              <div
                key={plan.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  border: isBestValue ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                  boxShadow: isBestValue 
                    ? '0 20px 40px -10px rgba(245, 158, 11, 0.2), 0 4px 12px rgba(0,0,0,0.04)' 
                    : '0 10px 25px -5px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  transform: isBestValue ? 'scale(1.02)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {/* Badge Tag */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: isBestValue ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : '#0F172A',
                    color: 'white',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.04em',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                  }}>
                    ★ {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div style={{
                  padding: '2rem 1.75rem 1.25rem 1.75rem',
                  borderBottom: '1px solid #F1F5F9',
                  background: isBestValue ? 'linear-gradient(180deg, #FFFDF5 0%, #FFFFFF 100%)' : '#FFFFFF'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#D97706',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {plan.durationLabel || `${plan.durationDays} Days Pass`}
                  </span>

                  <h3 style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: '4px 0 0.5rem 0'
                  }}>
                    {plan.name}
                  </h3>

                  {plan.description && (
                    <p style={{
                      fontSize: '0.82rem',
                      color: '#64748B',
                      margin: '0 0 1rem 0',
                      lineHeight: 1.45,
                      minHeight: '2.4em'
                    }}>
                      {plan.description}
                    </p>
                  )}

                  {/* Pricing */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A' }}>
                      ₹{plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span style={{ fontSize: '1.1rem', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                        ₹{plan.originalPrice}
                      </span>
                    )}
                    <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                      / pass
                    </span>
                  </div>
                </div>

                {/* Highlights / Perks Banner */}
                <div style={{
                  padding: '1.25rem 1.75rem',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '10px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Car size={18} color="#0284C7" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Washes</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{plan.washesCount} Included</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Gift size={18} color="#D97706" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Free Add-ons</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#B45309' }}>{plan.freeAddonsCount} Services</div>
                    </div>
                  </div>
                </div>

                {/* Checklist of Features */}
                <div style={{ padding: '1.5rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                    Included Privileges:
                  </div>
                  {parsedFeatures.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
                      <div style={{ marginTop: '2px', width: 16, height: 16, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={11} color="#15803D" strokeWidth={3} />
                      </div>
                      <span style={{ lineHeight: 1.4 }}>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div style={{ padding: '1.25rem 1.75rem 1.75rem 1.75rem' }}>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isSubscribing}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '14px',
                      background: isBestValue 
                        ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                        : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: isSubscribing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: isBestValue 
                        ? '0 8px 20px rgba(245, 158, 11, 0.35)' 
                        : '0 8px 20px rgba(15, 23, 42, 0.25)',
                      transition: 'transform 0.2s ease',
                      opacity: isSubscribing ? 0.75 : 1
                    }}
                  >
                    {isSubscribing ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} /> Processing...
                      </>
                    ) : (
                      <>
                        <Crown size={18} /> Join VIP Club • Subscribe
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. HOW IT WORKS & PERKS ACCORDION */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        border: '1.5px solid #E2E8F0',
        padding: '2rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.25rem', textAlign: 'center' }}>
          Why Vehicle Owners Love Wash My Car VIP Passes
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Gift size={20} color="#D97706" />
            </div>
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>Free Add-ons Included</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Choose complimentary add-on services like 2-Wheeler / Bike wash, helmet sanitization, and visor cleaning directly on checkout.
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Zap size={20} color="#0284C7" />
            </div>
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>Priority Slot Dispatch</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              VIP members receive first access to prime morning and weekend slots, with dedicated technician routing straight to your home.
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Shield size={20} color="#15803D" />
            </div>
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>Zero Rescheduling Fee</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Plans change? Reschedule your slot anytime with zero penalty. Your wash quota rolls over during the pass validity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
