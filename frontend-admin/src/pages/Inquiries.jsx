import React, { useState, useEffect } from 'react';
import { getInquiries, updateInquiryStatus, deleteInquiry } from '../api';
import { MessageSquare, AlertCircle, Phone, Mail, CheckCircle, Clock, Trash2, Edit3, Search, Filter, ShieldAlert, Sparkles, UserCheck, Image, Eye, ExternalLink, X } from 'lucide-react';

const parseInquiryImages = (imagesData) => {
  if (!imagesData) return [];
  if (Array.isArray(imagesData)) return imagesData;
  try {
    const parsed = JSON.parse(imagesData);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    if (typeof imagesData === 'string' && (imagesData.startsWith('data:image') || imagesData.startsWith('http'))) {
      return [imagesData];
    }
  }
  return [];
};

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, complaints: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeInquiryModal, setActiveInquiryModal] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const data = await getInquiries({
        type: typeFilter,
        status: statusFilter,
        search
      });
      if (data) {
        setInquiries(data.inquiries || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateInquiryStatus(id, { status: newStatus });
      fetchInquiries();
      if (activeInquiryModal && activeInquiryModal.id === id) {
        setActiveInquiryModal(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeInquiryModal) return;
    setSavingNotes(true);
    try {
      await updateInquiryStatus(activeInquiryModal.id, { notes: notesInput });
      fetchInquiries();
      setActiveInquiryModal(prev => ({ ...prev, notes: notesInput }));
      alert('Notes saved successfully!');
    } catch (err) {
      alert('Failed to save notes: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer inquiry?')) return;
    try {
      await deleteInquiry(id);
      fetchInquiries();
      if (activeInquiryModal && activeInquiryModal.id === id) {
        setActiveInquiryModal(null);
      }
    } catch (err) {
      alert('Failed to delete inquiry: ' + err.message);
    }
  };

  const openModal = (inq) => {
    setActiveInquiryModal(inq);
    setNotesInput(inq.notes || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)' }}>{stats.total || inquiries.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Enquiries</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706' }}>{stats.pending}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Action</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626' }}>{stats.complaints}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Complaints</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
              {inquiries.filter(i => i.status === 'RESOLVED' || i.status === 'CONTACTED').length}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contacted / Resolved</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Header & Filter Controls */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Customer Enquiries & Complaints</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({inquiries.length} listed)</span>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Category / Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <option value="ALL">All Categories</option>
              <option value="INQUIRY">Standard Inquiries</option>
              <option value="COMPLAINT">Complaints</option>
              <option value="FRANCHISE">Franchise Queries</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONTACTED">Contacted</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                placeholder="Search name, phone, issue..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '220px', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
                <Search size={15} />
              </button>
            </form>
          </div>
        </div>

        {/* Inquiries Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
              <tr>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Service</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Requirement / Message</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Received At</th>
                <th style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading inquiries and complaints...
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No inquiries or complaints match the current filter.
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => {
                  const isComplaint = inq.type === 'COMPLAINT';
                  const isFranchise = inq.type === 'FRANCHISE';
                  
                  return (
                    <tr key={inq.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                      
                      {/* Customer Info */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.95rem' }}>
                          {inq.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                          <Phone size={13} color="var(--primary-blue)" />
                          <a href={`tel:${inq.phone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                            {inq.phone}
                          </a>
                        </div>
                        {inq.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                            <Mail size={12} />
                            <span>{inq.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: isComplaint ? '#FEE2E2' : isFranchise ? '#EDE9FE' : '#E0F2FE',
                          color: isComplaint ? '#B91C1C' : isFranchise ? '#6D28D9' : '#0369A1'
                        }}>
                          {inq.type}
                        </span>
                      </td>

                      {/* Service Requested */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {inq.service || 'Doorstep Car Wash'}
                      </td>

                      {/* Message Preview */}
                      <td style={{ padding: '1rem 1.25rem', maxWidth: '300px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inq.message}
                        </div>
                        {parseInquiryImages(inq.images).length > 0 && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              padding: '0.12rem 0.45rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}>
                              <Image size={12} /> {parseInquiryImages(inq.images).length} Photo{parseInquiryImages(inq.images).length > 1 ? 's' : ''} Attached
                            </span>
                          </div>
                        )}
                        {inq.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem', fontWeight: 600 }}>
                            📝 Note: {inq.notes}
                          </div>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <select
                          value={inq.status}
                          onChange={e => handleStatusChange(inq.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            border: '1.5px solid',
                            cursor: 'pointer',
                            outline: 'none',
                            background: inq.status === 'PENDING' ? '#FEF3C7' : inq.status === 'CONTACTED' ? '#E0F2FE' : inq.status === 'RESOLVED' ? '#DCFCE7' : '#F1F5F9',
                            borderColor: inq.status === 'PENDING' ? '#F59E0B' : inq.status === 'CONTACTED' ? '#0284C7' : inq.status === 'RESOLVED' ? '#16A34A' : '#94A3B8',
                            color: inq.status === 'PENDING' ? '#92400E' : inq.status === 'CONTACTED' ? '#0369A1' : inq.status === 'RESOLVED' ? '#166534' : '#475569'
                          }}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>

                      {/* Received Date */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                        <div style={{ fontSize: '0.72rem' }}>
                          {new Date(inq.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => openModal(inq)}
                            className="btn btn-outline"
                            title="View Full Details & Notes"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            <Edit3 size={14} />
                            <span>Notes</span>
                          </button>
                          <button
                            onClick={() => handleDelete(inq.id)}
                            className="btn btn-outline"
                            title="Delete Inquiry"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderColor: '#FCA5A5', color: '#DC2626' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Notes Modal */}
      {activeInquiryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '540px', background: 'white', padding: '2rem', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} color="var(--primary-blue)" />
                <h3 style={{ margin: 0, color: 'var(--primary-navy)' }}>Inquiry #{activeInquiryModal.id} Details</h3>
              </div>
              <button onClick={() => setActiveInquiryModal(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}>
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Customer Box */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '1.05rem' }}>
                  {activeInquiryModal.name}
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.88rem' }}>
                  <div><strong>Phone:</strong> <a href={`tel:${activeInquiryModal.phone}`}>{activeInquiryModal.phone}</a></div>
                  <div><strong>Email:</strong> {activeInquiryModal.email || 'N/A'}</div>
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                  <strong>Service:</strong> {activeInquiryModal.service} | <strong>Category:</strong> {activeInquiryModal.type}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                  Customer Requirement / Complaint Text
                </label>
                <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', lineHeight: 1.5, color: '#1E293B', whiteSpace: 'pre-wrap' }}>
                  {activeInquiryModal.message}
                </div>
              </div>

              {/* Customer Attached Images Gallery */}
              {(() => {
                const attachedImages = parseInquiryImages(activeInquiryModal.images);
                if (!attachedImages || attachedImages.length === 0) return null;

                return (
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.45rem' }}>
                      <Image size={16} color="var(--primary-blue)" />
                      Customer Attached Photos ({attachedImages.length}/3)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                      {attachedImages.map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewImage(imgUrl)}
                          style={{
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1.5px solid #CBD5E1',
                            height: '110px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            transition: 'all 0.2s',
                            background: '#F8FAFC'
                          }}
                          title="Click to view full image"
                        >
                          <img src={imgUrl} alt={`Attachment ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(15, 23, 42, 0.75)',
                            padding: '0.2rem 0.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            gap: '0.25rem'
                          }}>
                            <Eye size={12} /> View Photo
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Status Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                  Current Status
                </label>
                <select
                  value={activeInquiryModal.status}
                  onChange={e => handleStatusChange(activeInquiryModal.id, e.target.value)}
                  className="form-input"
                  style={{ fontWeight: 700 }}
                >
                  <option value="PENDING">Pending Action</option>
                  <option value="CONTACTED">Representative Contacted</option>
                  <option value="RESOLVED">Resolved / Wash Scheduled</option>
                  <option value="CANCELLED">Cancelled / Not Interested</option>
                </select>
              </div>

              {/* Coordinator Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>
                  Internal Coordinator Notes
                </label>
                <textarea
                  rows="3"
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder="e.g. Spoke to customer, scheduled door-step wash for Saturday morning..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {savingNotes ? 'Saving Notes...' : 'Save Notes'}
                </button>
                <a
                  href={`https://wa.me/91${activeInquiryModal.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(activeInquiryModal.name)}%2C%20this%20is%20Wash%20My%20Car%20Org%20regarding%20your%20inquiry.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-teal"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                >
                  WhatsApp Customer →
                </a>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Full Image Zoom Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Enlarged attachment"
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: 'white',
                color: '#0F172A',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inquiries;
