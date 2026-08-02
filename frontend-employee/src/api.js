const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : 'https://wash-my-car.onrender.com/api';

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
  const res = await fetch(`${API_URL}/employees/profile`, { headers: getHeaders() }); // Service areas can be fetched from config or public routes. Let's make a call to public or profile
  // Actually, we can fetch all service areas. Let's create an area fetch helper:
  const areaRes = await fetch(`${API_URL}/admin/service-areas`, { headers: getHeaders() }); // Or fall back to a public service-areas endpoint if available.
  // Wait, does employee have admin access? No, so let's call users/service-areas which is public! That's very smart!
  const userAPI = API_URL.replace('/employees', '/users');
  const fallbackRes = await fetch(`${API_URL.replace('/employees', '/users')}/service-areas`, { headers: getHeaders() });
  if (!fallbackRes.ok) throw new Error(await fallbackRes.text());
  return fallbackRes.json();
};
