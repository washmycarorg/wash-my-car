const RAW_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api' : 'https://api.washmycar.org.in/api');
const API_URL = RAW_URL.endsWith('/api') ? RAW_URL : `${RAW_URL.replace(/\/$/, '')}/api`;

export const sendUserOtp = async (phone, purpose = 'LOGIN') => {
  const res = await fetch(`${API_URL}/auth/user/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, purpose })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to send OTP');
  }
  return data;
};

export const loginUser = async (phone, otp) => {
  const res = await fetch(`${API_URL}/auth/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Login failed');
  }
  if (data.token) localStorage.setItem('userToken', data.token);
  if (data.user) localStorage.setItem('userInfo', JSON.stringify(data.user));
  return data;
};

export const registerUser = async (formData) => {
  const res = await fetch(`${API_URL}/auth/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Registration failed');
  }
  if (data.token) localStorage.setItem('userToken', data.token);
  if (data.user) localStorage.setItem('userInfo', JSON.stringify(data.user));
  return data;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('userToken')}`
});

export const getProfile = async () => {
  const res = await fetch(`${API_URL}/users/profile`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getBookings = async () => {
  const res = await fetch(`${API_URL}/users/bookings`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createBooking = async (data) => {
  const res = await fetch(`${API_URL}/users/bookings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || await res.text().catch(() => 'Booking failed'));
  }
  return res.json();
};

export const verifyBookingPayment = async (data) => {
  const res = await fetch(`${API_URL}/users/bookings/verify-payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Payment verification failed');
  }
  return res.json();
};

export const cancelPendingPayment = async (bookingId, reason = 'PAYMENT_ABANDONED') => {
  const res = await fetch(`${API_URL}/users/bookings/${bookingId}/cancel-payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Failed to release slot');
  }
  return res.json();
};

export const cancelBooking = async (bookingId, reason) => {
  const res = await fetch(`${API_URL}/users/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to cancel booking');
  }
  return res.json();
};

export const getCars = async () => {
  const res = await fetch(`${API_URL}/users/cars`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const addCar = async (data) => {
  const res = await fetch(`${API_URL}/users/cars`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteCar = async (id) => {
  const res = await fetch(`${API_URL}/users/cars/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateProfile = async (data) => {
  const res = await fetch(`${API_URL}/users/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getServices = async () => {
  const res = await fetch(`${API_URL}/users/services`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// New API endpoints for advanced booking details
export const getCarTypes = async () => {
  const token = localStorage.getItem('userToken');
  const headers = token ? getHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_URL}/users/car-types`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getWashTypes = async () => {
  const token = localStorage.getItem('userToken');
  const headers = token ? getHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_URL}/users/wash-types`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getServiceAreas = async () => {
  const token = localStorage.getItem('userToken');
  const headers = token ? getHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_URL}/users/service-areas`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getWashPrice = async (carTypeId, washTypeId) => {
  const res = await fetch(`${API_URL}/users/price?carTypeId=${carTypeId}&washTypeId=${washTypeId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getAllWashPrices = async () => {
  const token = localStorage.getItem('userToken');
  const headers = token ? getHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_URL}/users/wash-prices`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getSavedAddresses = async () => {
  const res = await fetch(`${API_URL}/users/addresses`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const addSavedAddress = async (data) => {
  const res = await fetch(`${API_URL}/users/addresses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteSavedAddress = async (id) => {
  const res = await fetch(`${API_URL}/users/addresses/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getEligibleCoupons = async (carTypeId, washTypeId) => {
  let url = `${API_URL}/users/eligible-coupons`;
  const params = [];
  if (carTypeId) params.push(`carTypeId=${carTypeId}`);
  if (washTypeId) params.push(`washTypeId=${washTypeId}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getSettings = async () => {
  const token = localStorage.getItem('userToken');
  const headers = token ? getHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_URL}/users/settings`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getHomeContent = async () => {
  const res = await fetch(`${API_URL}/users/home-content`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getAddons = async () => {
  const res = await fetch(`${API_URL}/users/addons`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getActiveCoupons = async () => {
  try {
    const res = await fetch(`${API_URL}/users/active-coupons`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn("Could not fetch active coupons from server, using fallback:", err);
  }
  return [
    {
      id: 1,
      code: 'WC50',
      title: 'Welcome Offer',
      description: 'Flat 50% OFF for new users',
      discountType: 'PERCENTAGE',
      discountPct: 50,
      discountAmount: 0,
      active: true
    },
    {
      id: 2,
      code: 'SAVE99',
      title: 'Monsoon Special',
      description: 'Flat ₹99 OFF on Full Detail Wash',
      discountType: 'FLAT',
      discountPct: 0,
      discountAmount: 99,
      active: true
    }
  ];
};

export const submitInquiry = async (data) => {
  const res = await fetch(`${API_URL}/users/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorText = await res.text();
    try {
      const parsed = JSON.parse(errorText);
      throw new Error(parsed.error || parsed.message || errorText);
    } catch (e) {
      throw new Error(errorText || 'Failed to submit inquiry');
    }
  }
  return res.json();
};

export const getAvailableSlots = async (date, serviceAreaId, address = '', zone = '') => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (serviceAreaId) params.append('serviceAreaId', serviceAreaId);
  if (address) params.append('address', address);
  if (zone) params.append('zone', zone);
  
  const res = await fetch(`${API_URL}/users/available-slots?${params.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Subscriptions
export const getSubscriptionPlans = async (carTypeId = '') => {
  const url = carTypeId 
    ? `${API_URL}/users/subscriptions/plans?carTypeId=${carTypeId}` 
    : `${API_URL}/users/subscriptions/plans`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getMySubscriptions = async () => {
  const res = await fetch(`${API_URL}/users/subscriptions/my`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const subscribeToPlan = async (planId) => {
  const res = await fetch(`${API_URL}/users/subscriptions/subscribe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ planId })
  });
  if (!res.ok) {
    const errorText = await res.text();
    try {
      const parsed = JSON.parse(errorText);
      throw new Error(parsed.error || parsed.message || errorText);
    } catch (e) {
      throw new Error(errorText || 'Subscription failed');
    }
  }
  return res.json();
};

export const verifySubscriptionPayment = async (data) => {
  const res = await fetch(`${API_URL}/users/subscriptions/verify-payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorText = await res.text();
    try {
      const parsed = JSON.parse(errorText);
      throw new Error(parsed.error || parsed.message || errorText);
    } catch (e) {
      throw new Error(errorText || 'Payment verification failed');
    }
  }
  return res.json();
};

