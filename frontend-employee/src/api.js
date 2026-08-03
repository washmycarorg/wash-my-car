const API_URL = 'https://wash-my-car.onrender.com/api';

export const registerEmployee = async (name, phone, email, photo, aadhaarNumber, address, idProofFile, serviceAreaIds) => {
  const res = await fetch(`${API_URL}/auth/employee/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, photo, aadhaarNumber, address, idProofFile, serviceAreaIds })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const loginEmployee = async (phone, otp) => {
  const res = await fetch(`${API_URL}/auth/employee/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  localStorage.setItem('employeeToken', data.token);
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
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
