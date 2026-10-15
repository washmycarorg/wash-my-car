import React, { useState, useEffect } from 'react';
import { getUsers } from '../api';
import { 
  Users, Search, Crown, Calendar, Phone, Mail, Car, Clock, 
  CheckCircle, XCircle, AlertCircle, Sparkles, ChevronRight, X, 
  ArrowUpDown, Filter, Shield, Tag, RefreshCw, Layers
} from 'lucide-react';

const UsersDirectory = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSub, setFilterSub] = useState('ALL'); // ALL, SUBSCRIBED, NON_SUBSCRIBED
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalTab, setModalTab] = useState('bookings'); // 'bookings' or 'subscriptions'

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
  }, []);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
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
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
          <div style={{ overflowX: 'auto' }}>
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            setModalTab('bookings');
                          }}
                          className="btn btn-outline"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            borderRadius: '6px'
                          }}
                        >
                          View Details <ChevronRight size={13} />
                        </button>
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
          <div style={{
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
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: 'white', padding: '0 1.5rem' }}>
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

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersDirectory;
