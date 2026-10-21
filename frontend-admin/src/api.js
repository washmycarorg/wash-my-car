const RAW_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api' : 'https://api.washmycar.org.in/api');
const API_URL = RAW_URL.endsWith('/api') ? RAW_URL : `${RAW_URL.replace(/\/$/, '')}/api`;

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

export const updateUser = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to update user');
  }
  return res.json();
};

export const addUserPoints = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/users/${id}/points`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to add points');
  }
  return res.json();
};

export const grantFreeSubscription = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/users/${id}/grant-subscription`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to grant free subscription');
  }
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

export const updateBooking = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to update booking');
  }
  return res.json();
};

export const deleteBooking = async (id) => {
  const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to delete booking');
  }
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

export const cancelBookingByAdmin = async (id, reason) => {
  const res = await fetch(`${API_URL}/admin/bookings/${id}/cancel`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to cancel booking');
  }
  return res.json();
};

export const rescheduleBookingByAdmin = async (id, { newDate, newTimeSlot, reason }) => {
  const res = await fetch(`${API_URL}/admin/bookings/${id}/reschedule`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ newDate, newTimeSlot, reason })
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to reschedule booking');
  }
  return res.json();
};

export const markDoorstepRejectionByAdmin = async (id, note) => {
  const res = await fetch(`${API_URL}/admin/bookings/${id}/doorstep-rejection`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ note })
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to process doorstep rejection');
  }
  return res.json();
};

export const getAvailableSlotsForAdmin = async (date, serviceAreaId = '', address = '') => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (serviceAreaId) params.append('serviceAreaId', serviceAreaId);
  if (address) params.append('address', address);
  
  const res = await fetch(`${API_URL}/users/available-slots?${params.toString()}`);
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

export const createWashType = async (name, description, quickByte, fullCommission, partialCommission) => {
  const res = await fetch(`${API_URL}/admin/wash-types`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, description, quickByte, fullCommission, partialCommission })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateWashType = async (id, name, description, quickByte, fullCommission, partialCommission) => {
  const res = await fetch(`${API_URL}/admin/wash-types/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ name, description, quickByte, fullCommission, partialCommission })
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

export const updateInventoryItem = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/inventory/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to update inventory item');
  }
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

export const updateAllocation = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/inventory/allocate/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to update allocation');
  }
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
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to fetch settings');
  }
  return res.json();
};

export const updateSettings = async (data) => {
  const res = await fetch(`${API_URL}/admin/settings`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to update settings');
  }
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

// Inquiries & Complaints Management
export const getInquiries = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.type) searchParams.append('type', params.type);
  if (params.search) searchParams.append('search', params.search);
  
  const res = await fetch(`${API_URL}/admin/inquiries?${searchParams.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateInquiryStatus = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/inquiries/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteInquiry = async (id) => {
  const res = await fetch(`${API_URL}/admin/inquiries/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Slot Scheduling & Zone Dispatch Configuration
export const getSlotsConfig = async () => {
  const res = await fetch(`${API_URL}/admin/slots-config`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateSlotsConfig = async (data) => {
  const res = await fetch(`${API_URL}/admin/slots-config`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// Subscriptions Management
export const getSubscriptionPlans = async () => {
  const res = await fetch(`${API_URL}/admin/subscriptions/plans`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createSubscriptionPlan = async (data) => {
  const res = await fetch(`${API_URL}/admin/subscriptions/plans`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateSubscriptionPlan = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/subscriptions/plans/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteSubscriptionPlan = async (id) => {
  const res = await fetch(`${API_URL}/admin/subscriptions/plans/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getSubscribers = async () => {
  const res = await fetch(`${API_URL}/admin/subscriptions/subscribers`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

