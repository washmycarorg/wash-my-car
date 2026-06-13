const API_URL = 'http://localhost:5001/api';

export const loginUser = async (phone, otp) => {
  const res = await fetch(`${API_URL}/auth/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  localStorage.setItem('userToken', data.token);
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

export const updateProfile = async (data) => {
  const res = await fetch(`${API_URL}/users/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
