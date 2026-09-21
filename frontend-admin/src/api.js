const API_URL = 'https://wash-my-car.onrender.com/api';

export const loginAdmin = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  localStorage.setItem('adminToken', data.token);
  localStorage.setItem('adminInfo', JSON.stringify({ email }));
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

export const getUsers = async () => {
  const res = await fetch(`${API_URL}/admin/users`, { headers: getHeaders() });
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

export const autoAssignSlot = async (id) => {
  const res = await fetch(`${API_URL}/admin/bookings/${id}/auto-assign`, {
    method: 'PUT',
    headers: getHeaders()
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

// Legacy Services (Plans)
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

// Service Areas
export const getServiceAreas = async () => {
  const res = await fetch(`${API_URL}/admin/service-areas`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createServiceArea = async (data) => {
  const res = await fetch(`${API_URL}/admin/service-areas`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateServiceArea = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/service-areas/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteServiceArea = async (id) => {
  const res = await fetch(`${API_URL}/admin/service-areas/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Car Types
export const getCarTypes = async () => {
  const res = await fetch(`${API_URL}/admin/car-types`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createCarType = async (name) => {
  const res = await fetch(`${API_URL}/admin/car-types`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateCarType = async (id, name) => {
  const res = await fetch(`${API_URL}/admin/car-types/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteCarType = async (id) => {
  const res = await fetch(`${API_URL}/admin/car-types/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Wash Types
export const getWashTypes = async () => {
  const res = await fetch(`${API_URL}/admin/wash-types`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createWashType = async (name, description) => {
  const res = await fetch(`${API_URL}/admin/wash-types`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateWashType = async (id, name, description) => {
  const res = await fetch(`${API_URL}/admin/wash-types/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteWashType = async (id) => {
  const res = await fetch(`${API_URL}/admin/wash-types/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Wash Prices Matrix
export const getWashPrices = async () => {
  const res = await fetch(`${API_URL}/admin/wash-prices`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const saveWashPrice = async (data) => {
  const res = await fetch(`${API_URL}/admin/wash-prices`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getEmployeesWorkload = async (date, timeSlot) => {
  const res = await fetch(`${API_URL}/admin/employees/workload?date=${encodeURIComponent(date)}&timeSlot=${encodeURIComponent(timeSlot)}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Inventory Management
export const getInventoryItems = async () => {
  const res = await fetch(`${API_URL}/admin/inventory`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createInventoryItem = async (data) => {
  const res = await fetch(`${API_URL}/admin/inventory`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteInventoryItem = async (id) => {
  const res = await fetch(`${API_URL}/admin/inventory/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const allocateInventory = async (data) => {
  const res = await fetch(`${API_URL}/admin/inventory/allocate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteAllocation = async (id) => {
  const res = await fetch(`${API_URL}/admin/inventory/allocate/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getSettings = async () => {
  const res = await fetch(`${API_URL}/admin/settings`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateSettings = async (data) => {
  const res = await fetch(`${API_URL}/admin/settings`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getCmsSettings = async () => {
  const res = await fetch(`${API_URL}/admin/cms`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateCmsSettings = async (data) => {
  const res = await fetch(`${API_URL}/admin/cms`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Addons Management
export const getAddons = async () => {
  const res = await fetch(`${API_URL}/admin/addons`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createAddon = async (data) => {
  const res = await fetch(`${API_URL}/admin/addons`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateAddon = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/addons/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteAddon = async (id) => {
  const res = await fetch(`${API_URL}/admin/addons/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
