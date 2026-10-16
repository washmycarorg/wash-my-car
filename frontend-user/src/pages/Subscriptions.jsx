import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, Check, Sparkles, Car, Gift, Shield, 
  Calendar, ArrowRight, Zap, RefreshCw, AlertCircle, 
  ChevronRight, Star, Clock, CheckCircle2, X, AlertTriangle, 
  FileText, Plus, CheckSquare, Square
} from 'lucide-react';
import { 
  getSubscriptionPlans, 
  getMySubscriptions, 
  subscribeToPlan, 
  verifySubscriptionPayment, 
  getCarTypes, 
  getSettings,
  getCars
} from '../api';

const DEFAULT_TERMS = `1. Non-Refundable Policy: Once subscribed, the subscription pass amount is strictly non-refundable under any circumstances.
2. Single Vehicle Binding: This VIP Pass is exclusively linked and valid for the single registered vehicle (Registration number, make & model) chosen during purchase. Benefits cannot be shared or transferred to any other vehicle.
3. Doorstep Infrastructure Requirements: Customer agrees to provide domestic water tap connection, electricity plug point within reachable distance, and adequate clear workspace around the vehicle for safe technician cleaning.
4. Service Availability & Demand Holds: In cases of severe weather, technical equipment maintenance, high seasonal demand, or technician shortage, bookings may occasionally be placed on hold or rescheduled with prior intimation.
5. Plan Validity & Limit Expiration: All included washes and complimentary add-ons are valid strictly within the duration time span specified in the plan (e.g., 30 days). Any unused quota expires automatically upon plan end date. If all included wash limits are completed before the end date, the pass will expire earlier.`;

const Subscriptions = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Vehicle Selection States
  const [savedCars, setSavedCars] = useState([]);
  const [carSource, setCarSource] = useState('saved'); // 'saved' | 'new'
  const [selectedSavedCarId, setSelectedSavedCarId] = useState('');
  const [selectedCarTypeId, setSelectedCarTypeId] = useState(null);
  const [carNumber, setCarNumber] = useState('');
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [saveCar, setSaveCar] = useState(true);
  const [vehicleError, setVehicleError] = useState('');

  // Terms Agreement Modal States
  const [termsModalPlan, setTermsModalPlan] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [subscriptionTermsText, setSubscriptionTermsText] = useState(DEFAULT_TERMS);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, plansRes, mySubsRes, carTypesRes, carsRes] = await Promise.all([
        getSettings().catch(() => ({ subscriptionsEnabled: true })),
        getSubscriptionPlans().catch(() => ({ subscriptionsEnabled: true, plans: [] })),
        getMySubscriptions().catch(() => ({ activeSubscription: null, history: [] })),
        getCarTypes().catch(() => []),
        getCars().catch(() => [])
      ]);

      const isEnabled = settingsRes?.subscriptionsEnabled !== undefined ? settingsRes.subscriptionsEnabled : true;
      setSubscriptionsEnabled(isEnabled);

      if (settingsRes?.subscriptionTermsText) {
        setSubscriptionTermsText(settingsRes.subscriptionTermsText);
      }

      const loadedPlans = Array.isArray(plansRes?.plans) ? plansRes.plans : (Array.isArray(plansRes) ? plansRes : []);
      setPlans(loadedPlans);

      setMySubscription(mySubsRes?.activeSubscription || null);
      setSubscriptionHistory(mySubsRes?.history || []);

      const validCarTypes = Array.isArray(carTypesRes) ? carTypesRes : [];
      setCarTypes(validCarTypes);

      const loadedCars = Array.isArray(carsRes) ? carsRes : [];
      setSavedCars(loadedCars);

      // Default vehicle selection
      if (loadedCars.length > 0) {
        setCarSource('saved');
        setSelectedSavedCarId(loadedCars[0].id.toString());
        setSelectedCarTypeId(loadedCars[0].carTypeId);
        setCarNumber(loadedCars[0].carNumber || '');
        setCarMake(loadedCars[0].make || '');
        setCarModel(loadedCars[0].model || '');
      } else {
        setCarSource('new');
        if (validCarTypes.length > 0) {
          setSelectedCarTypeId(validCarTypes[0].id);
        }
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

  const handleSelectSavedCar = (car) => {
    setSelectedSavedCarId(car.id.toString());
    setSelectedCarTypeId(car.carTypeId);
    setCarNumber(car.carNumber || '');
    setCarMake(car.make || '');
    setCarModel(car.model || '');
    setVehicleError('');
  };

  const handleSelectCarType = (ctId) => {
    setSelectedCarTypeId(ctId);
    setVehicleError('');
  };

  const handleInitiateSubscribe = (plan) => {
    setVehicleError('');
    setErrorMsg(null);

    let effectiveCarNumber = '';
    let effectiveCarTypeId = selectedCarTypeId;

    if (carSource === 'saved') {
      if (!selectedSavedCarId) {
        setVehicleError('Please select one of your saved vehicles to bind your VIP pass.');
        const el = document.getElementById('vehicle-binding-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      const car = savedCars.find(c => c.id.toString() === selectedSavedCarId);
      effectiveCarNumber = car?.carNumber || carNumber;
      if (!effectiveCarNumber || effectiveCarNumber.trim().length < 4) {
        setVehicleError('Please ensure a valid registration number is entered for this car.');
        return;
      }
    } else {
      effectiveCarNumber = carNumber.trim();
      if (!effectiveCarNumber || effectiveCarNumber.length < 4) {
        setVehicleError('Please enter a valid vehicle registration number (e.g. TS 09 AB 1234).');
        const el = document.getElementById('vehicle-binding-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (!effectiveCarTypeId) {
        setVehicleError('Please select a vehicle category type.');
        const el = document.getElementById('vehicle-binding-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    setTermsAccepted(false);
    setTermsModalPlan(plan);
  };

  const handleConfirmAndPay = async () => {
    if (!termsAccepted) {
      alert('Please check the confirmation box acknowledging that you have read and agreed to the subscription terms.');
      return;
    }

    const plan = termsModalPlan;
    setTermsModalPlan(null);
    setSubscribingPlanId(plan.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        planId: plan.id,
        carId: carSource === 'saved' ? Number(selectedSavedCarId) : null,
        carMake: carMake ? carMake.trim() : null,
        carModel: carModel ? carModel.trim() : null,
        carNumber: carNumber ? carNumber.trim().toUpperCase() : null,
        saveCar: carSource === 'new' ? saveCar : false
      };

      const res = await subscribeToPlan(payload);

      if (res.requiresPayment && res.rzpOrder) {
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
          alert('Payment gateway failed to load. Please refresh the page and try again.');
          setSubscribingPlanId(null);
          return;
        }

        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const rzpOptions = {
          key: res.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: res.rzpOrder.amount,
          currency: res.rzpOrder.currency || 'INR',
          name: 'Wash My Car VIP Club',
          description: `${plan.name} (${plan.durationLabel}) for ${payload.carNumber || 'Registered Car'}`,
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

              setSuccessMsg(`Congratulations! Welcome to the VIP Club. Your ${plan.name} is now ACTIVE for vehicle ${payload.carNumber || ''}!`);
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
        setSuccessMsg(`Congratulations! Your ${plan.name} is now ACTIVE for vehicle ${payload.carNumber || ''}!`);
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
    return Number(p.carTypeId) === Number(selectedCarTypeId);
  });

  const selectedCarTypeObj = carTypes.find(ct => Number(ct.id) === Number(selectedCarTypeId));
  const currentActiveCarNumber = carSource === 'saved' 
    ? (savedCars.find(c => c.id.toString() === selectedSavedCarId)?.carNumber || carNumber)
    : carNumber;
  const currentActiveCarTitle = carSource === 'saved'
    ? `${savedCars.find(c => c.id.toString() === selectedSavedCarId)?.make || ''} ${savedCars.find(c => c.id.toString() === selectedSavedCarId)?.model || ''}`.trim()
    : `${carMake} ${carModel}`.trim();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* 1. HERO BANNER */}
      <div className="sub-hero-card">
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
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 900,
            lineHeight: 1.18,
            color: '#FFFFFF',
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
            fontSize: '0.95rem',
            color: '#CBD5E1',
            lineHeight: 1.6,
            margin: '0 0 1.5rem 0'
          }}>
            Join our exclusive VIP membership club. Choose or enter your vehicle below to fetch tailored passes. Benefits are exclusively linked to your chosen car with complimentary add-ons and zero booking friction!
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} color="white" strokeWidth={3} />
              </div>
              Regular Doorstep Washes
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
                width: '44px',
                height: '44px',
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
                
                {/* Linked Vehicle Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{
                    background: '#78350F',
                    color: '#FEF3C7',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Car size={13} />
                    {mySubscription.carNumber || mySubscription.car?.carNumber || 'Assigned Car'}
                  </span>
                  {(mySubscription.carMake || mySubscription.carModel || mySubscription.car?.make) && (
                    <span style={{ fontSize: '0.8rem', color: '#78350F', fontWeight: 700 }}>
                      {[mySubscription.carMake || mySubscription.car?.make, mySubscription.carModel || mySubscription.car?.model].filter(Boolean).join(' ')}
                    </span>
                  )}
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.75)',
                    color: '#92400E',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px'
                  }}>
                    {mySubscription.carType?.name || 'Standard'}
                  </span>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
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
                  padding: '0.75rem 1.25rem',
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

          {/* Breakdown of remaining washes and addons */}
          {(() => {
            let uWashes = [];
            try {
              uWashes = typeof mySubscription.washesBreakdown === 'string' ? JSON.parse(mySubscription.washesBreakdown) : (mySubscription.washesBreakdown || []);
            } catch (e) {}
            let uAddons = [];
            try {
              uAddons = typeof mySubscription.addonsBreakdown === 'string' ? JSON.parse(mySubscription.addonsBreakdown) : (mySubscription.addonsBreakdown || []);
            } catch (e) {}

            if (!uWashes.length && !uAddons.length) return null;

            return (
              <div style={{
                marginTop: '1rem',
                background: 'rgba(255, 255, 255, 0.85)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {uWashes.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                      Package Washes Balance:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
                      {uWashes.map((w, idx) => (
                        <span key={idx} style={{
                          background: Number(w.remaining) > 0 ? '#FEF3C7' : '#F1F5F9',
                          color: Number(w.remaining) > 0 ? '#78350F' : '#94A3B8',
                          border: Number(w.remaining) > 0 ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700
                        }}>
                          {w.washTypeName || 'Wash'}: {w.remaining} / {w.total || w.count || w.remaining} remaining
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {uAddons.filter(a => Number(a.total || a.count || a.remaining) > 0).length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                      Complimentary Free Add-ons Balance:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
                      {uAddons.filter(a => Number(a.total || a.count || a.remaining) > 0).map((a, idx) => (
                        <span key={idx} style={{
                          background: Number(a.remaining) > 0 ? '#DCFCE7' : '#F1F5F9',
                          color: Number(a.remaining) > 0 ? '#14532D' : '#94A3B8',
                          border: Number(a.remaining) > 0 ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700
                        }}>
                          🎁 Free {a.addonName || 'Add-on'}: {a.remaining} / {a.total || a.count || a.remaining} remaining
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. STEP 1: VEHICLE INTERLINKING & SELECTION */}
      <div id="vehicle-binding-section" className="sub-vehicle-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={16} color="#D97706" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Choose Vehicle for VIP Subscription
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
              Your VIP pass benefits are strictly interlinked to this car. Plans below will match its category.
            </p>
          </div>

          {/* Toggle Saved vs New Car */}
          <div style={{
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            display: 'inline-flex',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => {
                setCarSource('saved');
                if (savedCars.length > 0 && !selectedSavedCarId) {
                  handleSelectSavedCar(savedCars[0]);
                }
              }}
              style={{
                border: 'none',
                background: carSource === 'saved' ? '#FFFFFF' : 'transparent',
                color: carSource === 'saved' ? '#D97706' : '#64748B',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '6px 14px',
                borderRadius: '9px',
                cursor: 'pointer',
                boxShadow: carSource === 'saved' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Saved Cars ({savedCars.length})
            </button>
            <button
              type="button"
              onClick={() => setCarSource('new')}
              style={{
                border: 'none',
                background: carSource === 'new' ? '#FFFFFF' : 'transparent',
                color: carSource === 'new' ? '#D97706' : '#64748B',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '6px 14px',
                borderRadius: '9px',
                cursor: 'pointer',
                boxShadow: carSource === 'new' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              + Enter New Car
            </button>
          </div>
        </div>

        {/* Vehicle Error notice */}
        {vehicleError && (
          <div style={{
            background: '#FEF2F2',
            color: '#B91C1C',
            border: '1px solid #FECACA',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} /> {vehicleError}
          </div>
        )}

        {/* OPTION A: Saved Cars List */}
        {carSource === 'saved' && (
          <div>
            {savedCars.length === 0 ? (
              <div style={{
                padding: '1.5rem',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
                color: '#64748B'
              }}>
                <Car size={32} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>No saved vehicles found in your account.</p>
                <button
                  type="button"
                  onClick={() => setCarSource('new')}
                  style={{
                    background: '#D97706',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Enter New Car Details
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '0.85rem'
              }}>
                {savedCars.map(c => {
                  const isSelected = selectedSavedCarId === c.id.toString();
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectSavedCar(c)}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #D97706' : '1.5px solid #E2E8F0',
                        background: isSelected ? '#FFFBEB' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        boxShadow: isSelected ? '0 4px 14px rgba(217, 119, 6, 0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                          <span style={{
                            background: '#0F172A',
                            color: '#FCD34D',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            letterSpacing: '0.04em'
                          }}>
                            {c.carNumber || 'NO NUMBER'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.make} {c.model}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                          Class: <strong>{c.carType?.name || 'Standard'}</strong>
                        </div>
                      </div>

                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: isSelected ? '2px solid #D97706' : '2px solid #CBD5E1',
                        background: isSelected ? '#D97706' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected && <Check size={13} color="white" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* OPTION B: Enter New Car */}
        {carSource === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Vehicle Type Tabs */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                1. Select Vehicle Category Class *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                {carTypes.map(ct => {
                  const isSelected = Number(selectedCarTypeId) === Number(ct.id);
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => handleSelectCarType(ct.id)}
                      style={{
                        padding: '0.55rem 1rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #D97706' : '1.5px solid #E2E8F0',
                        background: isSelected ? '#FEF3C7' : '#FFFFFF',
                        color: isSelected ? '#92400E' : '#475569',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Car size={15} color={isSelected ? '#D97706' : '#64748B'} />
                      {ct.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs: Car Number, Make, Model */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  2. Registration Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. TS 09 AB 1234"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Car Brand / Manufacturer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyundai, Maruti, Honda"
                  value={carMake}
                  onChange={(e) => setCarMake(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Car Model Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. i20, Swift, City, Creta"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Checkbox Save car */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#334155',
              fontWeight: 600
            }}>
              <input
                type="checkbox"
                checked={saveCar}
                onChange={(e) => setSaveCar(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Save this vehicle to my garage profile for faster future bookings
            </label>
          </div>
        )}

        {/* Selected Vehicle Confirmation Strip */}
        <div className="sub-selected-strip">
          <div className="sub-selected-info">
            <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.84rem' }}>Selected Pass Vehicle:</span>
            <span className="sub-plate-badge">
              <Car size={13} style={{ marginRight: '4px' }} />
              {currentActiveCarNumber || 'ENTER NUMBER ABOVE'}
            </span>
            {currentActiveCarTitle && (
              <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>
                • {currentActiveCarTitle}
              </span>
            )}
            <span className="sub-category-badge">
              {selectedCarTypeObj?.name || 'Class'}
            </span>
          </div>

          <span className="sub-protection-badge">
            <Shield size={13} /> Only this car will be eligible for VIP benefits
          </span>
        </div>
      </div>

      {/* 4. SUBSCRIPTION PLANS FOR SELECTED VEHICLE */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Available VIP Passes for {selectedCarTypeObj?.name || 'Your Vehicle'}
        </h2>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
          Monthly & quarterly doorstep vehicle spa plans designed specifically for {selectedCarTypeObj?.name || 'your vehicle class'}.
        </p>
      </div>

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
          color: '#64748B',
          marginBottom: '3rem'
        }}>
          <Crown size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#1E293B' }}>No Plans Available for this Vehicle Class</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Please select another vehicle or check back later.</p>
        </div>
      ) : (
        <div className="sub-plans-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}>
          {filteredPlans.map(plan => {
            let parsedFeatures = [];
            try {
              parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
            } catch (e) {
              parsedFeatures = [plan.features];
            }

            let parsedIncludedWashes = [];
            try {
              parsedIncludedWashes = typeof plan.includedWashes === 'string' ? JSON.parse(plan.includedWashes) : (plan.includedWashes || []);
            } catch (e) {}

            let parsedIncludedAddons = [];
            try {
              parsedIncludedAddons = typeof plan.includedAddons === 'string' ? JSON.parse(plan.includedAddons) : (plan.includedAddons || []);
            } catch (e) {}

            const isSubscribing = subscribingPlanId === plan.id;
            const isBestValue = (plan.badge || '').toUpperCase().includes('POPULAR') || (plan.badge || '').toUpperCase().includes('BEST');

            return (
              <div
                key={plan.id}
                className="sub-plan-card"
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
                <div className="sub-plan-header" style={{
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

                {/* Highlights Banner */}
                <div className="sub-plan-highlights" style={{
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

                {/* Breakdown of Washes & Free Addons */}
                {(parsedIncludedWashes.some(w => Number(w.count) > 0) || parsedIncludedAddons.some(a => Number(a.count) > 0)) && (
                  <div className="sub-plan-breakdown" style={{
                    padding: '0.85rem 1.75rem',
                    background: '#FFFDF5',
                    borderBottom: '1px solid #FEF3C7',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    {parsedIncludedWashes.filter(w => Number(w.count) > 0).length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Included Washes:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                          {parsedIncludedWashes.filter(w => Number(w.count) > 0).map((w, idx) => (
                            <span key={idx} style={{ background: '#FEF3C7', color: '#78350F', border: '1px solid #FDE68A', fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                              {w.count}x {w.washTypeName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {parsedIncludedAddons.filter(a => Number(a.count) > 0).length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Complimentary Free Add-ons:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                          {parsedIncludedAddons.filter(a => Number(a.count) > 0).map((a, idx) => (
                            <span key={idx} style={{ background: '#DCFCE7', color: '#14532D', border: '1px solid #BBF7D0', fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                              {a.count}x Free {a.addonName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Checklist of Features */}
                <div className="sub-plan-features" style={{ padding: '1.5rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
                <div className="sub-plan-cta" style={{ padding: '1.25rem 1.75rem 1.75rem 1.75rem' }}>
                  <button
                    onClick={() => handleInitiateSubscribe(plan)}
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
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>Exclusive Vehicle Coverage</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Your pass is bound to your registered vehicle number. Enjoy seamless zero-friction doorstep detailing every month without entering payment details repeatedly.
            </p>
          </div>
        </div>
      </div>

      {/* 6. SUBSCRIPTION TERMS & CONDITIONS MODAL (MANDATORY BEFORE PAYMENT) */}
      {termsModalPlan && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: 'min(86vh, 720px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.45)',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 100000
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} color="#D97706" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>
                    VIP Subscription Terms & Agreement
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                    Review service conditions before completing payment
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTermsModalPlan(null)}
                style={{
                  background: '#E2E8F0',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Vehicle & Plan Binding Summary Card */}
              <div style={{
                background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                border: '1.5px solid #FCD34D',
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                    Pass Binding Vehicle:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                    <span style={{
                      background: '#0F172A',
                      color: '#FCD34D',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {currentActiveCarNumber}
                    </span>
                    {currentActiveCarTitle && (
                      <span style={{ fontWeight: 800, color: '#78350F', fontSize: '0.9rem' }}>
                        {currentActiveCarTitle}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#92400E' }}>
                      ({selectedCarTypeObj?.name})
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>
                    {termsModalPlan.name}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#451A03' }}>
                    ₹{termsModalPlan.price}
                  </div>
                </div>
              </div>

              {/* Core Subscription Legal Conditions */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} color="#D97706" /> Mandatory VIP Club Service Policy:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* Point 1: Non-Refundable */}
                  <div style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem'
                  }}>
                    <AlertTriangle size={18} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#991B1B', lineHeight: 1.45 }}>
                      <strong>Non-Refundable Policy:</strong> Once subscribed and payment is processed, the subscription pass amount is <strong>strictly non-refundable</strong> under any circumstances.
                    </div>
                  </div>

                  {/* Point 2: Vehicle Binding */}
                  <div style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem'
                  }}>
                    <Car size={18} color="#0284C7" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
                      <strong>Single Vehicle Exclusivity:</strong> Only your chosen registered vehicle (<strong>{currentActiveCarNumber}</strong>) is eligible for these subscription plan benefits. If you book for any other vehicle, normal plan rates will apply with promotional coupons.
                    </div>
                  </div>

                  {/* Point 3: Utilities & Clearance */}
                  <div style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem'
                  }}>
                    <Zap size={18} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
                      <strong>Doorstep Utilities & Working Space:</strong> Customer must provide accessible domestic water tap connection, a functional electrical socket, and sufficient clearance space around the vehicle for the employee to clean safely.
                    </div>
                  </div>

                  {/* Point 4: Service Hold & Demand */}
                  <div style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem'
                  }}>
                    <Clock size={18} color="#7C3AED" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
                      <strong>Operational & High Demand Holds:</strong> Due to extreme weather conditions, high seasonal demand, equipment maintenance, or employee shortages, doorstep slots may occasionally be held or rescheduled with prior communication.
                    </div>
                  </div>

                  {/* Point 5: Validity & Expiry */}
                  <div style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem'
                  }}>
                    <Calendar size={18} color="#15803D" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45 }}>
                      <strong>Validity Period & Limit Expiry:</strong> All wash quotas and free add-ons are valid strictly within the time span specified in the plan ({termsModalPlan.durationLabel || `${termsModalPlan.durationDays} days`}). Unused quotas expire on the validity end date. Additionally, if all wash limits are exhausted before the validity ends, the pass will expire immediately.
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Admin Terms Note if altered */}
              {subscriptionTermsText && subscriptionTermsText !== DEFAULT_TERMS && (
                <div style={{
                  background: '#F1F5F9',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  color: '#475569',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5,
                  border: '1px solid #CBD5E1'
                }}>
                  <div style={{ fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                    Additional Terms Configured by Administration:
                  </div>
                  {subscriptionTermsText}
                </div>
              )}

              {/* Agreement Acceptance Checkbox */}
              <div
                onClick={() => setTermsAccepted(!termsAccepted)}
                style={{
                  background: termsAccepted ? '#DCFCE7' : '#FFFDF5',
                  border: termsAccepted ? '1.5px solid #86EFAC' : '1.5px solid #FCD34D',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: termsAccepted ? '2px solid #16A34A' : '2px solid #CBD5E1',
                  background: termsAccepted ? '#16A34A' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '2px',
                  flexShrink: 0
                }}>
                  {termsAccepted && <Check size={14} color="white" strokeWidth={3} />}
                </div>

                <div style={{ fontSize: '0.84rem', color: termsAccepted ? '#166534' : '#78350F', fontWeight: 700, lineHeight: 1.45 }}>
                  I have read, understood, and accept all the VIP Subscription terms and conditions. I agree that this pass is strictly non-refundable and valid exclusively for vehicle <strong>{currentActiveCarNumber}</strong>.
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setTermsModalPlan(null)}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAndPay}
                disabled={!termsAccepted}
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: termsAccepted 
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                    : '#CBD5E1',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: termsAccepted ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: termsAccepted ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none'
                }}
              >
                <Crown size={17} /> Accept & Pay ₹{termsModalPlan.price}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
