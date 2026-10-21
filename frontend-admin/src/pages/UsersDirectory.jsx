import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, addUserPoints, grantFreeSubscription, getSubscriptionPlans, getCarTypes } from '../api';
import { 
  Users, Search, Crown, Calendar, Phone, Mail, Car, Clock, 
  CheckCircle, XCircle, AlertCircle, Sparkles, ChevronRight, X, 
  ArrowUpDown, Filter, Shield, Tag, RefreshCw, Layers, Edit2, Coins, Gift, Plus
} from 'lucide-react';

const UsersDirectory = () => {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSub, setFilterSub] = useState('ALL'); // ALL, SUBSCRIBED, NON_SUBSCRIBED
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalTab, setModalTab] = useState('bookings'); // 'bookings' or 'subscriptions' or 'points'

  // Edit User Modal State
  const [editUserModal, setEditUserModal] = useState(null); // { id, name, email, phone }
  const [editUserLoading, setEditUserLoading] = useState(false);

  // Add Points Modal State
  const [pointsModal, setPointsModal] = useState(null); // { user, points: '', reason: '' }
  const [pointsLoading, setPointsLoading] = useState(false);

  // Grant Free Subscription Modal State
  const [freeSubModal, setFreeSubModal] = useState(null); // { user, planId, carId, carNumber, carMake, carModel }
  const [freeSubLoading, setFreeSubLoading] = useState(false);

  const fetchUsersList = () => {
    setLoading(true);
    getUsers()
      .then(data => {
        setUsers(data || []);
      })
      .catch(err => console.error('Failed to load users directory:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsersList();
    getSubscriptionPlans()
      .then(p => setPlans(Array.isArray(p) ? p : []))
      .catch(err => console.error('Failed to load subscription plans:', err));
    getCarTypes()
      .then(ct => setCarTypes(Array.isArray(ct) ? ct : []))
      .catch(err => console.error('Failed to load car types:', err));
  }, []);

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editUserModal) return;
    if (!editUserModal.phone || !editUserModal.phone.trim()) {
      alert('Phone number is required.');
      return;
    }
    setEditUserLoading(true);
    try {
      const res = await updateUser(editUserModal.id, {
        name: editUserModal.name?.trim() || '',
        email: editUserModal.email?.trim() || '',
        phone: editUserModal.phone.trim()
      });
      alert(res.message || 'Customer profile updated successfully!');
      setEditUserModal(null);
      fetchUsersList();
      if (selectedUser && selectedUser.id === editUserModal.id) {
        setSelectedUser(prev => ({
          ...prev,
          name: editUserModal.name?.trim() || '',
          email: editUserModal.email?.trim() || '',
          phone: editUserModal.phone.trim()
        }));
      }
    } catch (err) {
      alert('Failed to update user: ' + (err.message || 'Unknown error'));
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleAddPointsSubmit = async (e) => {
    e.preventDefault();
    if (!pointsModal || !pointsModal.user) return;
    const pts = parseInt(pointsModal.points, 10);
    if (isNaN(pts) || pts === 0) {
      alert('Please enter a valid non-zero points number');
      return;
    }
    if (!pointsModal.reason || !pointsModal.reason.trim()) {
      alert('Please enter a mandatory reason for adding/adjusting points');
      return;
    }
    setPointsLoading(true);
    try {
      const res = await addUserPoints(pointsModal.user.id, {
        points: pts,
        reason: pointsModal.reason.trim()
      });
      alert(res.message || 'Points added successfully! Log posted to user rewards.');
      setPointsModal(null);
      fetchUsersList();
      if (selectedUser && selectedUser.id === pointsModal.user.id) {
        setSelectedUser(prev => ({
          ...prev,
          points: res.user?.points ?? ((prev.points || 0) + pts),
          pointTransactions: [
            res.transaction,
            ...(prev.pointTransactions || [])
          ]
        }));
      }
    } catch (err) {
      alert('Failed to add points: ' + (err.message || 'Unknown error'));
    } finally {
      setPointsLoading(false);
    }
  };

  const handleGrantFreeSubSubmit = async (e) => {
    e.preventDefault();
    if (!freeSubModal || !freeSubModal.user) return;
    if (!freeSubModal.planId) {
      alert('Please choose a subscription plan to grant.');
      return;
    }
    setFreeSubLoading(true);
    try {
      const res = await grantFreeSubscription(freeSubModal.user.id, {
        planId: Number(freeSubModal.planId),
        carId: freeSubModal.carId ? Number(freeSubModal.carId) : undefined,
        carNumber: freeSubModal.carNumber?.trim(),
        carMake: freeSubModal.carMake?.trim(),
        carModel: freeSubModal.carModel?.trim()
      });
      alert(res.message || 'VIP Subscription pass successfully granted for ₹0!');
      setFreeSubModal(null);
      fetchUsersList();
      if (selectedUser && selectedUser.id === freeSubModal.user.id) {
        setSelectedUser(prev => ({
          ...prev,
          subscriptions: [
            res.subscription,
            ...(prev.subscriptions || [])
          ]
        }));
      }
    } catch (err) {
      alert('Failed to grant free subscription: ' + (err.message || 'Unknown error'));
    } finally {
      setFreeSubLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (u.name || '').toLowerCase().includes(q);
    const phoneMatch = (u.phone || '').includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const referralMatch = (u.referralCode || '').toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || phoneMatch || emailMatch || referralMatch;

    const activeSub = (u.subscriptions || []).find(s => 
      s.status === 'ACTIVE' && 
      s.paymentStatus === 'PAID' && 
      s.washesRemaining > 0 && 
      new Date(s.endDate) > new Date()
    );

    if (filterSub === 'SUBSCRIBED' && !activeSub) return false;
    if (filterSub === 'NON_SUBSCRIBED' && activeSub) return false;

    return matchesSearch;
  });

  const activeSubscribersCount = users.filter(u => 
    (u.subscriptions || []).some(s => 
      s.status === 'ACTIVE' && 
      s.paymentStatus === 'PAID' && 
      s.washesRemaining > 0 && 
      new Date(s.endDate) > new Date()
    )
  ).length;

  const totalBookingsCount = users.reduce((acc, u) => acc + (u.bookings?.length || 0), 0);

  const getActiveSubscription = (user) => {
    return (user.subscriptions || []).find(s => 
      s.status === 'ACTIVE' && 
      s.paymentStatus === 'PAID' && 
      s.washesRemaining > 0 && 
      new Date(s.endDate) > new Date()
    );
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={26} color="var(--primary-blue)" /> Users Directory
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comprehensive directory of registered customers, active subscriptions, and complete booking histories.
          </p>
        </div>
        <button
          onClick={fetchUsersList}
          className="btn btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} /> Refresh List
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL REGISTERED USERS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-navy)', marginTop: '0.25rem' }}>
                {users.length}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="var(--primary-blue)" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE VIP SUBSCRIBERS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#B45309', marginTop: '0.25rem' }}>
                {activeSubscribersCount}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={22} color="#D97706" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CUMULATIVE BOOKINGS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#047857', marginTop: '0.25rem' }}>
                {totalBookingsCount}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={22} color="#16A34A" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={17} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, phone, email, or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', margin: 0, width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>SUBSCRIPTION:</span>
          <select
            value={filterSub}
            onChange={e => setFilterSub(e.target.value)}
            className="form-input"
            style={{ width: 'auto', margin: 0, padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Users ({users.length})</option>
            <option value="SUBSCRIBED">VIP Subscribers Only ({activeSubscribersCount})</option>
            <option value="NON_SUBSCRIBED">Non-Subscribers ({users.length - activeSubscribersCount})</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-0" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            Loading customer directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Users size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--primary-navy)' }}>No users found</h4>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>Try clearing or adjusting your search keyword and filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Customer</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Phone Number</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Active Subscription</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Date of Join</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Bookings</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const activeSub = getActiveSubscription(user);
                  const joinDate = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A';

                  return (
                    <tr
                      key={user.id}
                      onClick={() => { setSelectedUser(user); setModalTab('bookings'); }}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: activeSub ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                            color: activeSub ? '#B45309' : 'var(--primary-blue)',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.95rem',
                            flexShrink: 0
                          }}>
                            {(user.name || user.phone || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {user.name || 'Anonymous User'}
                              {activeSub && <Crown size={14} color="#D97706" />}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {user.email || 'No email registered'}
                              {user.referralCode && <> &bull; Code: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.referralCode}</span></>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-navy)', fontWeight: 600 }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span>{user.phone}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600, marginTop: '2px' }}>
                          {user.points || 0} wallet points
                        </div>
                      </td>

                      {/* Subscription Taken */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {activeSub ? (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{
                              background: '#FEF3C7',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              width: 'fit-content'
                            }}>
                              <Crown size={13} color="#B45309" />
                              {activeSub.plan?.name || 'Active Subscription'}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#B45309', fontWeight: 600 }}>
                              {activeSub.washesRemaining}/{activeSub.washesTotal} washes left &bull; Valid till {new Date(activeSub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            background: '#F1F5F9',
                            color: '#64748B',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.76rem',
                            fontWeight: 600
                          }}>
                            No Subscription
                          </span>
                        )}
                      </td>

                      {/* Date of Join */}
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-navy)', fontSize: '0.85rem' }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          {joinDate}
                        </div>
                      </td>

                      {/* Bookings Count */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          background: (user.bookings?.length || 0) > 0 ? '#E0F2FE' : '#F1F5F9',
                          color: (user.bookings?.length || 0) > 0 ? '#0369A1' : '#64748B',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          {user.bookings?.length || 0} {user.bookings?.length === 1 ? 'Wash' : 'Washes'}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditUserModal({
                                id: user.id,
                                name: user.name || '',
                                email: user.email || '',
                                phone: user.phone || ''
                              });
                            }}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', borderRadius: '6px' }}
                            title="Edit Name, Email, Phone"
                          >
                            <Edit2 size={12} color="var(--primary-blue)" /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPointsModal({
                                user,
                                points: '',
                                reason: ''
                              });
                            }}
                            className="btn"
                            style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.3rem 0.55rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', borderRadius: '6px', fontWeight: 600 }}
                            title="Add/Adjust Reward Points with Reason"
                          >
                            <Coins size={12} color="#059669" /> +Points
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFreeSubModal({
                                user,
                                planId: plans[0]?.id || '',
                                carId: user.cars?.[0]?.id || '',
                                carNumber: user.cars?.[0]?.carNumber || '',
                                carMake: user.cars?.[0]?.make || '',
                                carModel: user.cars?.[0]?.model || ''
                              });
                            }}
                            className="btn"
                            style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '0.3rem 0.55rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', borderRadius: '6px', fontWeight: 600 }}
                            title="Grant Free VIP Subscription Pass"
                          >
                            <Crown size={12} color="#B45309" /> +VIP Pass
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setModalTab('bookings');
                            }}
                            className="btn btn-outline"
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.76rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              borderRadius: '6px'
                            }}
                          >
                            Details <ChevronRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Drawer / Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(selectedUser.name || selectedUser.phone || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedUser.name || 'Anonymous User'}
                    {getActiveSubscription(selectedUser) && (
                      <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Crown size={12} color="#D97706" /> VIP
                      </span>
                    )}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <span>📞 {selectedUser.phone}</span>
                    {selectedUser.email && <span>✉️ {selectedUser.email}</span>}
                    <span>📅 Joined: {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>🎁 Points: <strong style={{ color: '#16A34A' }}>{selectedUser.points || 0}</strong></span>
                  </div>

                  {/* Quick Action Buttons in Modal Header */}
                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setEditUserModal({
                        id: selectedUser.id,
                        name: selectedUser.name || '',
                        email: selectedUser.email || '',
                        phone: selectedUser.phone || ''
                      })}
                      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                    >
                      <Edit2 size={12} /> Edit Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointsModal({
                        user: selectedUser,
                        points: '',
                        reason: ''
                      })}
                      style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                    >
                      <Coins size={12} /> Add Points
                    </button>
                    <button
                      type="button"
                      onClick={() => setFreeSubModal({
                        user: selectedUser,
                        planId: plans[0]?.id || '',
                        carId: selectedUser.cars?.[0]?.id || '',
                        carNumber: selectedUser.cars?.[0]?.carNumber || '',
                        carMake: selectedUser.cars?.[0]?.make || '',
                        carModel: selectedUser.cars?.[0]?.model || ''
                      })}
                      style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                    >
                      <Crown size={12} /> Grant VIP Plan
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: '#E2E8F0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#475569" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: 'white', padding: '0 1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setModalTab('bookings')}
                style={{
                  padding: '0.85rem 1.25rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'bookings' ? '3px solid var(--primary-blue)' : '3px solid transparent',
                  color: modalTab === 'bookings' ? 'var(--primary-blue)' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Calendar size={16} /> Bookings Done ({selectedUser.bookings?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('subscriptions')}
                style={{
                  padding: '0.85rem 1.25rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'subscriptions' ? '3px solid #D97706' : '3px solid transparent',
                  color: modalTab === 'subscriptions' ? '#B45309' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Crown size={16} /> Subscriptions Taken ({selectedUser.subscriptions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('points')}
                style={{
                  padding: '0.85rem 1.25rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: modalTab === 'points' ? '3px solid #16A34A' : '3px solid transparent',
                  color: modalTab === 'points' ? '#15803D' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Coins size={16} /> Points & Rewards Log ({selectedUser.pointTransactions?.length || 0})
              </button>
            </div>

            {/* Modal Body: Scrollable History */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#FAFBFC' }}>
              
              {/* TAB 1: BOOKINGS HISTORY (LATEST TO OLDEST) */}
              {modalTab === 'bookings' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      All Wash Bookings (Sorted Newest to Oldest)
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Total: {selectedUser.bookings?.length || 0} bookings
                    </span>
                  </div>

                  {(!selectedUser.bookings || selectedUser.bookings.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <Calendar size={36} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>No bookings created yet</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>This customer has not booked any doorstep wash services yet.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {selectedUser.bookings.map((b) => {
                        const statusColors = {
                          PENDING: { bg: '#FEF3C7', color: '#92400E' },
                          ASSIGNED: { bg: '#DBEAFE', color: '#1E40AF' },
                          STARTED: { bg: '#E0F2FE', color: '#0369A1' },
                          COMPLETED: { bg: '#D1FAE5', color: '#065F46' },
                          CANCELLED: { bg: '#FEE2E2', color: '#991B1B' }
                        };
                        const sCfg = statusColors[b.status] || { bg: '#F1F5F9', color: '#475569' };

                        return (
                          <div
                            key={b.id}
                            style={{
                              background: 'white',
                              border: '1px solid #E2E8F0',
                              borderRadius: '12px',
                              padding: '1rem 1.25rem',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                              <div>
                                <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                                  #{b.id} &bull; {b.washType?.name || 'Wash Service'}
                                </span>
                                {b.carType?.name && (
                                  <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '0.1rem 0.5rem', borderRadius: '6px', marginLeft: '0.4rem', fontWeight: 600 }}>
                                    {b.carType.name}
                                  </span>
                                )}
                              </div>
                              <span style={{ background: sCfg.bg, color: sCfg.color, padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                                {b.status}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <span>📅 {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({b.timeSlot})</span>
                              {(b.carNumber || b.carMake) && (
                                <span>🚗 {b.carMake} {b.carModel} {b.carNumber ? `(${b.carNumber})` : ''}</span>
                              )}
                              {b.employee?.name && (
                                <span>👨‍🔧 Tech: <strong>{b.employee.name}</strong></span>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                Paid via: <strong>{b.paymentMethod || 'ONLINE'}</strong> ({b.paymentStatus})
                              </span>
                              <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '1rem' }}>
                                ₹{b.price}
                              </span>
                            </div>

                            {b.status === 'CANCELLED' && b.cancellationReason && (
                              <div style={{ marginTop: '0.45rem', padding: '0.4rem 0.65rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '0.78rem', color: '#991B1B' }}>
                                <strong>Cancellation Reason:</strong> {b.cancellationReason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SUBSCRIPTIONS HISTORY (LATEST TO OLDEST) */}
              {modalTab === 'subscriptions' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      All Subscriptions Taken (Sorted Newest to Oldest)
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Total: {selectedUser.subscriptions?.length || 0} subscriptions
                    </span>
                  </div>

                  {(!selectedUser.subscriptions || selectedUser.subscriptions.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <Crown size={36} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>No subscriptions taken yet</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>This customer has not purchased any VIP membership passes yet.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {selectedUser.subscriptions.map((sub) => {
                        const isExpired = sub.status === 'EXPIRED' || sub.washesRemaining <= 0 || new Date(sub.endDate) < new Date();
                        const isActive = sub.status === 'ACTIVE' && sub.paymentStatus === 'PAID' && !isExpired;

                        return (
                          <div
                            key={sub.id}
                            style={{
                              background: 'white',
                              border: isActive ? '1.5px solid #FDE68A' : '1px solid #E2E8F0',
                              borderRadius: '12px',
                              padding: '1.1rem 1.25rem',
                              boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.1)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Crown size={16} color={isActive ? '#D97706' : '#94A3B8'} />
                                  <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.98rem' }}>
                                    {sub.plan?.name || `Subscription Pass #${sub.id}`}
                                  </span>
                                  {sub.carType?.name && (
                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '0.1rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                                      {sub.carType.name}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  Purchased on {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              </div>

                              <span style={{
                                background: isActive ? '#FEF3C7' : '#F1F5F9',
                                color: isActive ? '#92400E' : '#64748B',
                                border: isActive ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}>
                                {isActive ? 'ACTIVE' : 'EXPIRED'}
                              </span>
                            </div>

                            {/* Washes Remaining Progress */}
                            <div style={{ margin: '0.75rem 0', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                <span style={{ color: 'var(--primary-navy)' }}>Doorstep Foam Washes</span>
                                <span style={{ color: isActive ? '#0284C7' : '#64748B' }}>
                                  {sub.washesRemaining} of {sub.washesTotal} remaining
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${Math.min(100, (sub.washesRemaining / (sub.washesTotal || 1)) * 100)}%`,
                                  height: '100%',
                                  background: isActive ? 'linear-gradient(90deg, #38BDF8, #0284C7)' : '#94A3B8'
                                }} />
                              </div>

                              {sub.freeAddonsTotal > 0 && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#166534', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Free Add-ons Quota:</span>
                                  <strong>{sub.freeAddonsRemaining} of {sub.freeAddonsTotal} left</strong>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              <div>
                                Validity: <strong>{new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong> to <strong>{new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                              </div>
                              <div style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                                ₹{sub.price} Paid
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: POINTS & REWARDS LOG */}
              {modalTab === 'points' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Reward Points & Coins History Ledger
                      </span>
                      <div style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                        Current Balance: {selectedUser.points || 0} wallet points
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPointsModal({ user: selectedUser, points: '', reason: '' })}
                      className="btn"
                      style={{ background: '#16A34A', color: 'white', padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Plus size={14} /> Add Points with Reason
                    </button>
                  </div>

                  {(!selectedUser.pointTransactions || selectedUser.pointTransactions.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <Coins size={36} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>No points transactions logged yet</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Use the "Add Points with Reason" button above to credit or adjust this user's wallet points.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedUser.pointTransactions.map((tx) => {
                        const isCredit = (tx.points || 0) >= 0;
                        return (
                          <div
                            key={tx.id}
                            style={{
                              background: 'white',
                              border: '1px solid #E2E8F0',
                              borderRadius: '12px',
                              padding: '0.9rem 1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: isCredit ? '#DCFCE7' : '#FEE2E2',
                                color: isCredit ? '#15803D' : '#DC2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <Coins size={18} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.9rem' }}>
                                    {tx.reason || (isCredit ? 'Points Credited' : 'Points Debited')}
                                  </span>
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    background: tx.type === 'DEBIT' ? '#FEE2E2' : '#F0FDF4',
                                    color: tx.type === 'DEBIT' ? '#DC2626' : '#16A34A',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase'
                                  }}>
                                    {tx.type || (isCredit ? 'CREDIT' : 'DEBIT')}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                  📅 {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>

                            <div style={{
                              fontWeight: 900,
                              fontSize: '1.15rem',
                              color: isCredit ? '#16A34A' : '#DC2626',
                              fontFamily: 'monospace'
                            }}>
                              {isCredit ? `+${tx.points}` : tx.points} pts
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Edit User Information Modal */}
      {editUserModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Edit2 size={20} color="var(--primary-blue)" /> Edit Customer Information
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>User ID: #{editUserModal.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditUserModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={editUserModal.name}
                  onChange={e => setEditUserModal({ ...editUserModal, name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Number (Required)</label>
                <input
                  required
                  type="tel"
                  className="form-input"
                  placeholder="10-digit mobile number"
                  value={editUserModal.phone}
                  onChange={e => setEditUserModal({ ...editUserModal, phone: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. customer@example.com"
                  value={editUserModal.email}
                  onChange={e => setEditUserModal({ ...editUserModal, email: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  disabled={editUserLoading}
                  className="btn btn-outline"
                  style={{ borderRadius: '8px', padding: '0.55rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="btn btn-primary"
                  style={{ borderRadius: '8px', padding: '0.55rem 1.4rem' }}
                >
                  {editUserLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Points with Reason Modal */}
      {pointsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#047857', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Coins size={20} color="#059669" /> Add Reward Points
              </h3>
              <button
                type="button"
                onClick={() => setPointsModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            {/* User overview info */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.9rem' }}>
                  {pointsModal.user?.name || 'Customer'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                  📞 {pointsModal.user?.phone}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>CURRENT WALLET</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16A34A' }}>
                  {pointsModal.user?.points || 0} pts
                </div>
              </div>
            </div>

            <form onSubmit={handleAddPointsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Points to Credit / Adjust <span style={{ color: '#DC2626' }}>*</span></label>
                <input
                  required
                  type="number"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 50 (or -25 to deduct)"
                  value={pointsModal.points}
                  onChange={e => setPointsModal({ ...pointsModal, points: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  Enter a positive number to add coins, or negative to deduct.
                </span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mandatory Reason (Visible in Customer's Rewards Page) <span style={{ color: '#DC2626' }}>*</span></label>
                <textarea
                  required
                  rows={3}
                  className="form-input"
                  placeholder="e.g. Compensation for weather reschedule, promotional sign-up perk, loyal customer appreciation, customer support resolution..."
                  value={pointsModal.reason}
                  onChange={e => setPointsModal({ ...pointsModal, reason: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', borderRadius: '8px' }}
                />
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#1E40AF', lineHeight: 1.45 }}>
                ✨ <strong>Instant Push & Log:</strong> Customer will immediately receive a browser notification and this note will appear in their Rewards Coins history.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPointsModal(null)}
                  disabled={pointsLoading}
                  className="btn btn-outline"
                  style={{ borderRadius: '8px', padding: '0.55rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pointsLoading || !pointsModal.points || !pointsModal.reason?.trim()}
                  className="btn"
                  style={{ background: '#16A34A', color: 'white', borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700 }}
                >
                  {pointsLoading ? 'Crediting...' : 'Add Points Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Free Subscription Plan Modal */}
      {freeSubModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div className="admin-modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#B45309', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Crown size={20} color="#D97706" /> Grant Free VIP Subscription Plan
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Customer: <strong>{freeSubModal.user?.name || freeSubModal.user?.phone}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFreeSubModal(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleGrantFreeSubSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Select Admin-Configured Plan */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Subscription Plan (Admin Configured) <span style={{ color: '#DC2626' }}>*</span></label>
                <select
                  required
                  className="form-input"
                  value={freeSubModal.planId}
                  onChange={e => setFreeSubModal({ ...freeSubModal, planId: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  <option value="">-- Choose Subscription Plan --</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.carType?.name || 'All Car Types'} &bull; {p.washesTotal} Washes &bull; {p.durationDays} Days)
                    </option>
                  ))}
                </select>
              </div>

              {/* Saved Cars Option if any */}
              {freeSubModal.user?.cars && freeSubModal.user.cars.length > 0 && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Link to Customer's Saved Vehicle</label>
                  <select
                    className="form-input"
                    value={freeSubModal.carId}
                    onChange={e => {
                      const selectedCarId = e.target.value;
                      if (!selectedCarId) {
                        setFreeSubModal({ ...freeSubModal, carId: '', carNumber: '', carMake: '', carModel: '' });
                      } else {
                        const found = freeSubModal.user.cars.find(c => c.id === Number(selectedCarId));
                        if (found) {
                          setFreeSubModal({
                            ...freeSubModal,
                            carId: found.id,
                            carNumber: found.carNumber || '',
                            carMake: found.make || '',
                            carModel: found.model || ''
                          });
                        }
                      }
                    }}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Enter Custom / New Vehicle Below --</option>
                    {freeSubModal.user.cars.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.make} {c.model} - {c.carNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Vehicle Number & Model */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Car Number Plate</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. AP39EK1234"
                    value={freeSubModal.carNumber}
                    onChange={e => setFreeSubModal({ ...freeSubModal, carNumber: e.target.value.toUpperCase() })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Car Make & Model</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hyundai Creta"
                    value={`${freeSubModal.carMake || ''} ${freeSubModal.carModel || ''}`.trim()}
                    onChange={e => {
                      const parts = e.target.value.split(' ');
                      setFreeSubModal({
                        ...freeSubModal,
                        carMake: parts[0] || '',
                        carModel: parts.slice(1).join(' ') || ''
                      });
                    }}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Complimentary Banner */}
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#92400E', lineHeight: 1.45 }}>
                <div style={{ fontWeight: 800, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Crown size={14} color="#D97706" /> Price: ₹0 (Sponsored Complimentary VIP Pass)
                </div>
                The VIP subscription will be activated instantly with full wash limit and validity days configured in the selected plan.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFreeSubModal(null)}
                  disabled={freeSubLoading}
                  className="btn btn-outline"
                  style={{ borderRadius: '8px', padding: '0.55rem 1.2rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={freeSubLoading || !freeSubModal.planId}
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #D97706, #B45309)', color: 'white', borderRadius: '8px', padding: '0.55rem 1.4rem', fontWeight: 700 }}
                >
                  {freeSubLoading ? 'Granting Pass...' : 'Grant Free Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersDirectory;
