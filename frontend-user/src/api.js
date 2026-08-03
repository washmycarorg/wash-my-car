const API_URL = 'https://wash-my-car.onrender.com/api';

export const loginUser = async (phone, otp) => {
  const res = await fetch(`${API_URL}/auth/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  localStorage.setItem('userToken', data.token);
  localStorage.setItem('userInfo', JSON.stringify(data.user));
  return data;
};

export const registerUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
  if (!res.ok) throw new Error(await res.text());
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
  const res = await fetch(`${API_URL}/users/settings`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getHomeContent = async () => {
  const res = await fetch(`${API_URL}/users/home-content`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
