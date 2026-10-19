const RAW_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api' : 'https://api.washmycar.org.in/api');
const API_URL = RAW_URL.endsWith('/api') ? RAW_URL : `${RAW_URL.replace(/\/$/, '')}/api`;

const parseError = async (res) => {
  try {
    const data = await res.json();
    return data.error || data.message || 'Request failed';
  } catch {
    return res.statusText || 'Request failed';
  }
};

export const registerEmployee = async (name, phone, email, password, confirmPassword, photo, aadhaarNumber, address, idProofFile, serviceAreaIds) => {
  const res = await fetch(`${API_URL}/auth/employee/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, password, confirmPassword, photo, aadhaarNumber, address, idProofFile, serviceAreaIds })
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const loginEmployee = async (identifier, password) => {
  const res = await fetch(`${API_URL}/auth/employee/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('employeeToken', data.token);
  }
  if (data.employee) {
    localStorage.setItem('employeeInfo', JSON.stringify(data.employee));
  }
  return data;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`
});

export const getProfile = async () => {
  const res = await fetch(`${API_URL}/employees/profile`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getAssignedBookings = async () => {
  const res = await fetch(`${API_URL}/employees/bookings`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const toggleDuty = async (onDuty) => {
  const res = await fetch(`${API_URL}/employees/duty`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ onDuty })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const startBooking = async (id, photo, latitude, longitude) => {
  const res = await fetch(`${API_URL}/employees/bookings/${id}/start`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ photo, latitude, longitude })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const completeBooking = async (id, photo, latitude, longitude) => {
  const res = await fetch(`${API_URL}/employees/bookings/${id}/complete`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ photo, latitude, longitude })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateProfile = async (data) => {
  const res = await fetch(`${API_URL}/employees/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getServiceAreas = async () => {
  const fallbackRes = await fetch(`${API_URL}/users/service-areas`, { headers: getHeaders() });
  if (!fallbackRes.ok) throw new Error(await fallbackRes.text());
  return fallbackRes.json();
};

export const getInventory = async () => {
  const res = await fetch(`${API_URL}/employees/inventory`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const reportBookingIssue = async (id, issueType, note) => {
  const res = await fetch(`${API_URL}/employees/bookings/${id}/report-issue`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ issueType, note })
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const markDoorstepRejection = async (id, note = '') => {
  const res = await fetch(`${API_URL}/employees/bookings/${id}/doorstep-rejection`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ note })
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const getVapidPublicKey = async () => {
  const res = await fetch(`${API_URL}/notifications/vapid-public-key`);
  if (!res.ok) throw new Error('Failed to fetch VAPID key');
  return res.json();
};

export const subscribePushNotification = async (subscription, userType = 'EMPLOYEE') => {
  const res = await fetch(`${API_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ subscription, userType })
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

