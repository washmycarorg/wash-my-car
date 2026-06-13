const API_URL = 'http://localhost:5001/api';

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

export const updateBookingStatus = async (id, status) => {
  const res = await fetch(`${API_URL}/employees/bookings/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const completeBooking = (id) => updateBookingStatus(id, 'COMPLETED');

export const updateProfile = async (data) => {
  const res = await fetch(`${API_URL}/employees/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
