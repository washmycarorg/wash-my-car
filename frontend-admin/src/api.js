const API_URL = 'http://localhost:5001/api';

export const loginAdmin = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  localStorage.setItem('adminToken', data.token);
  return data;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

export const getStats = async () => {
  const res = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getEmployees = async () => {
  const res = await fetch(`${API_URL}/admin/employees`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const toggleEmployeeStatus = async (id, status) => {
  const res = await fetch(`${API_URL}/admin/employees/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateEmployee = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/employees/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getBookings = async () => {
  const res = await fetch(`${API_URL}/admin/bookings`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const assignSlot = async (id, employeeId) => {
  const res = await fetch(`${API_URL}/admin/bookings/${id}/assign`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ employeeId })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getLeaves = async () => {
  const res = await fetch(`${API_URL}/admin/leaves`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateLeaveStatus = async (id, status) => {
  const res = await fetch(`${API_URL}/admin/leaves/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getOffers = async () => {
  const res = await fetch(`${API_URL}/admin/offers`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createOffer = async (data) => {
  const res = await fetch(`${API_URL}/admin/offers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateOffer = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/offers/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteOffer = async (id) => {
  const res = await fetch(`${API_URL}/admin/offers/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getServices = async () => {
  const res = await fetch(`${API_URL}/admin/services`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createService = async (data) => {
  const res = await fetch(`${API_URL}/admin/services`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateService = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/services/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteService = async (id) => {
  const res = await fetch(`${API_URL}/admin/services/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
