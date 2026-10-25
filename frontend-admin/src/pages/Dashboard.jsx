import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Calendar, Users, TrendingUp, TrendingDown, 
  Clock, MapPin, Car, Sparkles, Filter, RefreshCw, 
  ChevronRight, Eye, AlertCircle, ArrowUpRight, ArrowDownRight, 
  Flame, Star, X, Copy, Check, CheckCircle2, 
  BarChart3, PieChart, ShieldCheck, ChevronDown, 
  Phone, User as UserIcon, HelpCircle, Navigation
} from 'lucide-react';
import { getStats, getBookings, getWashTypes, getCarTypes, getServiceAreas } from '../api';

// Date format helper (DD/MM/YYYY)
const formatDateDMY = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format short date for charts (e.g., "12 Oct")
const formatShortDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Safe date normalization to 'YYYY-MM-DD'
const toISODate = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return dateInput.substring(0, 10);
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Color palette for charts
const PALETTE = [
  '#1565C0', // Blue
  '#00B4D8', // Teal
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [washTypes, setWashTypes] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [datePreset, setDatePreset] = useState('all'); // all, today, yesterday, 7days, 30days, thisMonth, lastMonth, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dateField, setDateField] = useState('serviceDate'); // serviceDate vs bookingDate
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETED, ACTIVE, CANCELLED

  // Interactive Chart States
  const [trendMetric, setTrendMetric] = useState('revenue'); // revenue vs bookings
  const [chartHoverPoint, setChartHoverPoint] = useState(null);
  const [activeSegmentTab, setActiveSegmentTab] = useState('washes'); // washes, cars, zones

  // Selected Booking for Quick Detail View Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Load Data
  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setError('Admin session token missing. Please sign in again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      let fetchError = null;
      const [statsRes, bookingsRes, wtRes, ctRes, saRes] = await Promise.all([
        getStats().catch(err => { fetchError = err; return null; }),
        getBookings().catch(err => { fetchError = err; return null; }),
        getWashTypes().catch(() => []),
        getCarTypes().catch(() => []),
        getServiceAreas().catch(() => []),
      ]);

      if (fetchError && (!bookingsRes || bookingsRes.length === 0)) {
        const msg = fetchError.message || String(fetchError);
        console.error('API Fetch failed:', fetchError);
        if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token')) {
          setError('Admin session has expired. Please log out and sign in again to refresh your session.');
        } else {
          setError(`Unable to fetch live bookings from server (${msg}). Ensure backend is active on http://127.0.0.1:5001.`);
        }
      }

      if (statsRes) setStats(statsRes);
      if (Array.isArray(bookingsRes)) setBookings(bookingsRes);
      if (Array.isArray(wtRes)) setWashTypes(wtRes);
      if (Array.isArray(ctRes)) setCarTypes(ctRes);
      if (Array.isArray(saRes)) setServiceAreas(saRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to fetch dashboard data: ' + (err.message || 'Connection error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute preset date bounds
  const getPresetRange = (preset) => {
    const now = new Date();
    const todayStr = toISODate(now);

    if (preset === 'all') return { start: null, end: null, label: 'All Time' };

    if (preset === 'today') {
      return { start: todayStr, end: todayStr, label: 'Today' };
    }

    if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toISODate(y);
      return { start: yStr, end: yStr, label: 'Yesterday' };
    }

    if (preset === '7days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { start: toISODate(d), end: todayStr, label: 'Last 7 Days' };
    }

    if (preset === '30days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { start: toISODate(d), end: todayStr, label: 'Last 30 Days' };
    }

    if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: toISODate(start), end: toISODate(end), label: 'This Month' };
    }

    if (preset === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toISODate(start), end: toISODate(end), label: 'Last Month' };
    }

    if (preset === 'custom') {
      return { 
        start: customStart || null, 
        end: customEnd || null, 
        label: customStart && customEnd ? `${formatDateDMY(customStart)} - ${formatDateDMY(customEnd)}` : 'Custom Range' 
      };
    }

    return { start: null, end: null, label: 'All Time' };
  };

  const activeRange = useMemo(() => getPresetRange(datePreset), [datePreset, customStart, customEnd]);

  // Filter Bookings by Date and Status
  const filteredBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];

    return bookings.filter(b => {
      // Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'COMPLETED' && b.status !== 'COMPLETED') return false;
        if (statusFilter === 'CANCELLED' && b.status !== 'CANCELLED') return false;
        if (statusFilter === 'ACTIVE' && !['PENDING', 'ASSIGNED', 'STARTED'].includes(b.status)) return false;
      }

      // Date Range Filter
      if (!activeRange.start && !activeRange.end) return true;

      const dateToUse = dateField === 'serviceDate' 
        ? (b.date || b.createdAt) 
        : (b.createdAt || b.date);

      const bookingDateStr = toISODate(dateToUse);
      if (!bookingDateStr) return false;

      if (activeRange.start && bookingDateStr < activeRange.start) return false;
      if (activeRange.end && bookingDateStr > activeRange.end) return false;

      return true;
    });
  }, [bookings, activeRange, dateField, statusFilter]);

  // Filtered Overview Metrics
  const metrics = useMemo(() => {
    const totalCount = filteredBookings.length;
    const completed = filteredBookings.filter(b => b.status === 'COMPLETED');
    const active = filteredBookings.filter(b => ['PENDING', 'ASSIGNED', 'STARTED'].includes(b.status));
    const cancelled = filteredBookings.filter(b => b.status === 'CANCELLED');

    // Revenue calculated from completed or non-cancelled bookings
    const totalRevenue = completed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : (totalCount > 0 ? (filteredBookings.reduce((s, b) => s + (Number(b.price) || 0), 0) / totalCount) : 0);

    // Reviews satisfaction
    const reviewsWithRating = filteredBookings.filter(b => b.review && typeof b.review.rating === 'number');
    const avgRating = reviewsWithRating.length > 0
      ? (reviewsWithRating.reduce((sum, b) => sum + b.review.rating, 0) / reviewsWithRating.length).toFixed(1)
      : '4.8';

    const completionRate = totalCount > 0 
      ? Math.round((completed.length / totalCount) * 100) 
      : 100;

    return {
      totalCount,
      completedCount: completed.length,
      activeCount: active.length,
      cancelledCount: cancelled.length,
      totalRevenue,
      avgOrderValue,
      avgRating,
      completionRate,
      reviewsCount: reviewsWithRating.length
    };
  }, [filteredBookings]);

  // Wash Type Stats (Highest & Least)
  const washTypeStats = useMemo(() => {
    const map = {};

    // Seed configured wash types
    washTypes.forEach(wt => {
      map[wt.id] = {
        id: wt.id,
        name: wt.name || `Plan #${wt.id}`,
        count: 0,
        completedCount: 0,
        revenue: 0,
        quickByte: wt.quickByte || ''
      };
    });

    // Aggregate from filtered bookings
    filteredBookings.forEach(b => {
      const wtId = b.washTypeId || (b.washType && b.washType.id) || 'unknown';
      const wtName = (b.washType && b.washType.name) || `Wash Type ${wtId}`;

      if (!map[wtId]) {
        map[wtId] = {
          id: wtId,
          name: wtName,
          count: 0,
          completedCount: 0,
          revenue: 0,
          quickByte: ''
        };
      }

      map[wtId].count += 1;
      if (b.status === 'COMPLETED') {
        map[wtId].completedCount += 1;
        map[wtId].revenue += (Number(b.price) || 0);
      }
    });

    const list = Object.values(map);
    // Sort descending by count, then revenue
    list.sort((a, b) => b.count - a.count || b.revenue - a.revenue);

    const totalBookingsCount = filteredBookings.length || 1;
    list.forEach(item => {
      item.percentage = totalBookingsCount > 0 ? Math.round((item.count / totalBookingsCount) * 100) : 0;
      item.avgPrice = item.completedCount > 0 ? Math.round(item.revenue / item.completedCount) : 0;
    });

    const bookedOnly = list.filter(item => item.count > 0);
    const highest = bookedOnly.length > 0 ? bookedOnly[0] : (list[0] || null);
    const least = bookedOnly.length > 1 ? bookedOnly[bookedOnly.length - 1] : (list[list.length - 1] || null);

    return { list, highest, least };
  }, [filteredBookings, washTypes]);

  // Car Type Stats (Highest & Least)
  const carTypeStats = useMemo(() => {
    const map = {};

    // Seed configured car types
    carTypes.forEach(ct => {
      map[ct.id] = {
        id: ct.id,
        name: ct.name || `Car Type #${ct.id}`,
        count: 0,
        completedCount: 0,
        revenue: 0
      };
    });

    // Aggregate from filtered bookings
    filteredBookings.forEach(b => {
      const ctId = b.carTypeId || (b.carType && b.carType.id) || 'unknown';
      const ctName = (b.carType && b.carType.name) || `Vehicle #${ctId}`;

      if (!map[ctId]) {
        map[ctId] = {
          id: ctId,
          name: ctName,
          count: 0,
          completedCount: 0,
          revenue: 0
        };
      }

      map[ctId].count += 1;
      if (b.status === 'COMPLETED') {
        map[ctId].completedCount += 1;
        map[ctId].revenue += (Number(b.price) || 0);
      }
    });

    const list = Object.values(map);
    list.sort((a, b) => b.count - a.count || b.revenue - a.revenue);

    const totalBookingsCount = filteredBookings.length || 1;
    list.forEach(item => {
      item.percentage = totalBookingsCount > 0 ? Math.round((item.count / totalBookingsCount) * 100) : 0;
      item.avgPrice = item.completedCount > 0 ? Math.round(item.revenue / item.completedCount) : 0;
    });

    const bookedOnly = list.filter(item => item.count > 0);
    const highest = bookedOnly.length > 0 ? bookedOnly[0] : (list[0] || null);
    const least = bookedOnly.length > 1 ? bookedOnly[bookedOnly.length - 1] : (list[list.length - 1] || null);

    return { list, highest, least };
  }, [filteredBookings, carTypes]);

  // Service Area / Zone Stats (Highest & Least)
  const areaStats = useMemo(() => {
    const map = {};

    // Seed configured service areas
    serviceAreas.forEach(sa => {
      map[sa.id] = {
        id: sa.id,
        name: sa.name || `Zone #${sa.id}`,
        count: 0,
        completedCount: 0,
        revenue: 0
      };
    });

    filteredBookings.forEach(b => {
      const saId = b.serviceAreaId || (b.serviceArea && b.serviceArea.id) || 'unknown';
      const saName = (b.serviceArea && b.serviceArea.name) || `Area #${saId}`;

      if (!map[saId]) {
        map[saId] = {
          id: saId,
          name: saName,
          count: 0,
          completedCount: 0,
          revenue: 0
        };
      }

      map[saId].count += 1;
      if (b.status === 'COMPLETED') {
        map[saId].completedCount += 1;
        map[saId].revenue += (Number(b.price) || 0);
      }
    });

    const list = Object.values(map);
    list.sort((a, b) => b.count - a.count || b.revenue - a.revenue);

    const totalBookingsCount = filteredBookings.length || 1;
    const maxCount = list[0]?.count || 1;

    list.forEach(item => {
      item.percentage = totalBookingsCount > 0 ? Math.round((item.count / totalBookingsCount) * 100) : 0;
      item.intensity = Math.round((item.count / maxCount) * 100);
      item.demandStatus = item.count >= 10 ? 'High Demand' : (item.count >= 3 ? 'Moderate' : 'Low Volume');
    });

    const bookedOnly = list.filter(item => item.count > 0);
    const highest = bookedOnly.length > 0 ? bookedOnly[0] : (list[0] || null);
    const least = bookedOnly.length > 1 ? bookedOnly[bookedOnly.length - 1] : (list[list.length - 1] || null);

    return { list, highest, least };
  }, [filteredBookings, serviceAreas]);

  // Timeline Trend Chart Data Aggregation
  const trendData = useMemo(() => {
    if (filteredBookings.length === 0) return [];

    // Map bookings by date string
    const dateMap = {};

    filteredBookings.forEach(b => {
      const dateToUse = dateField === 'serviceDate' ? (b.date || b.createdAt) : (b.createdAt || b.date);
      const dStr = toISODate(dateToUse);
      if (!dStr) return;

      if (!dateMap[dStr]) {
        dateMap[dStr] = {
          dateStr: dStr,
          label: formatShortDate(dStr),
          fullDate: formatDateDMY(dStr),
          revenue: 0,
          bookings: 0,
          completed: 0
        };
      }

      dateMap[dStr].bookings += 1;
      if (b.status === 'COMPLETED') {
        dateMap[dStr].completed += 1;
        dateMap[dStr].revenue += (Number(b.price) || 0);
      }
    });

    // Sort chronologically
    const sorted = Object.values(dateMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // If single point or empty, fill small range for smooth chart rendering
    if (sorted.length === 1) {
      return [
        { ...sorted[0], label: sorted[0].label + ' (Start)', revenue: sorted[0].revenue * 0.8 },
        sorted[0]
      ];
    }

    return sorted;
  }, [filteredBookings, dateField]);

  // Latest 5 Bookings
  const latestFiveBookings = useMemo(() => {
    // Sort all bookings by createdAt or date descending
    const sorted = [...bookings].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date).getTime() || 0;
      const dateB = new Date(b.createdAt || b.date).getTime() || 0;
      return dateB - dateA;
    });
    return sorted.slice(0, 5);
  }, [bookings]);

  // Status color pill helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success" style={{ gap: '0.3rem' }}><CheckCircle2 size={12} /> Completed</span>;
      case 'STARTED':
        return <span className="badge" style={{ background: '#E0F2FE', color: '#0284C7', gap: '0.3rem' }}><Clock size={12} /> In Progress</span>;
      case 'ASSIGNED':
        return <span className="badge" style={{ background: '#EDE9FE', color: '#6366F1', gap: '0.3rem' }}><ShieldCheck size={12} /> Assigned</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger" style={{ gap: '0.3rem' }}><X size={12} /> Cancelled</span>;
      default:
        return <span className="badge badge-warning" style={{ gap: '0.3rem' }}><Clock size={12} /> Pending</span>;
    }
  };

  // Helper to copy booking ID
  const handleCopyId = (id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // SVG Area / Line Chart Drawing Logic
  const renderTrendChart = () => {
    if (trendData.length === 0) {
      return (
        <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <Calendar size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 500 }}>No bookings recorded for this date selection</p>
          <span style={{ fontSize: '0.8rem' }}>Try switching presets to "All Time" or widening the date filter</span>
        </div>
      );
    }

    const width = 800;
    const height = 260;
    const padTop = 30;
    const padBottom = 40;
    const padLeft = 60;
    const padRight = 30;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const values = trendData.map(d => trendMetric === 'revenue' ? d.revenue : d.bookings);
    const maxVal = Math.max(...values, trendMetric === 'revenue' ? 1000 : 5);
    const minVal = 0;

    // Calculate (x, y) coordinates for points
    const points = trendData.map((d, i) => {
      const val = trendMetric === 'revenue' ? d.revenue : d.bookings;
      const x = padLeft + (i / (trendData.length - 1 || 1)) * chartW;
      const y = padTop + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
      return { x, y, data: d, val };
    });

    // Build SVG Path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const pPrev = points[i - 1];
      const pCurr = points[i];
      // Smooth cubic curve control points
      const cpX = (pPrev.x + pCurr.x) / 2;
      linePath += ` C ${cpX} ${pPrev.y}, ${cpX} ${pCurr.y}, ${pCurr.x} ${pCurr.y}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

    // Horizontal grid lines (4 levels)
    const gridTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
      const val = minVal + ratio * (maxVal - minVal);
      const y = padTop + chartH - ratio * chartH;
      return { val: trendMetric === 'revenue' ? `₹${Math.round(val).toLocaleString()}` : Math.round(val), y };
    });

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          style={{ width: '100%', minWidth: '600px', height: '280px', display: 'block' }}
          onMouseLeave={() => setChartHoverPoint(null)}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1565C0" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#00B4D8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#00B4D8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1565C0" />
              <stop offset="50%" stopColor="#00B4D8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1565C0" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines and Y labels */}
          {gridTicks.map((tick, idx) => (
            <g key={idx}>
              <line 
                x1={padLeft} 
                y1={tick.y} 
                x2={width - padRight} 
                y2={tick.y} 
                stroke="#E2E8F0" 
                strokeDasharray={idx === 0 ? 'none' : '4 4'} 
                strokeWidth={idx === 0 ? 1.5 : 1} 
              />
              <text 
                x={padLeft - 10} 
                y={tick.y + 4} 
                fontSize="11" 
                fill="#94A3B8" 
                textAnchor="end"
                fontWeight="500"
              >
                {tick.val}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#trendGradient)" />

          {/* Smooth line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke="url(#lineGradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = chartHoverPoint && chartHoverPoint.idx === idx;
            return (
              <g 
                key={idx} 
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setChartHoverPoint({ ...pt, idx })}
              >
                {/* Invisible larger hit target for smooth hover */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                {/* Visible dot */}
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={isHovered ? 6.5 : 4} 
                  fill={isHovered ? '#00B4D8' : '#FFFFFF'} 
                  stroke="#1565C0" 
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'all 0.15s ease' }}
                />
                {/* X Axis Label */}
                {(points.length <= 10 || idx % Math.ceil(points.length / 8) === 0 || idx === points.length - 1) && (
                  <text 
                    x={pt.x} 
                    y={height - 12} 
                    fontSize="11" 
                    fill="#64748B" 
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {pt.data.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {chartHoverPoint && (
          <div 
            style={{
              position: 'absolute',
              left: `${(chartHoverPoint.x / width) * 100}%`,
              top: `${Math.max(10, chartHoverPoint.y - 85)}px`,
              transform: 'translateX(-50%)',
              background: 'var(--primary-navy)',
              color: 'white',
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              pointerEvents: 'none',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              zIndex: 20,
              minWidth: '130px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontWeight: 700, color: '#93C5FD', marginBottom: '0.2rem' }}>
              {chartHoverPoint.data.fullDate}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              {trendMetric === 'revenue' 
                ? `₹${chartHoverPoint.data.revenue.toLocaleString()}` 
                : `${chartHoverPoint.data.bookings} Bookings`}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
              {trendMetric === 'revenue' 
                ? `${chartHoverPoint.data.bookings} Total • ${chartHoverPoint.data.completed} Done`
                : `₹${chartHoverPoint.data.revenue.toLocaleString()} Revenue`}
            </div>
          </div>
        )}
      </div>
    );
  };

  // SVG Donut Chart for Wash Packages Distribution
  const renderWashDonutChart = () => {
    const list = washTypeStats.list.filter(w => w.count > 0);
    const total = list.reduce((s, w) => s + w.count, 0);

    if (total === 0) {
      return (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          No package data recorded for this date range.
        </div>
      );
    }

    const size = 180;
    const strokeWidth = 26;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedOffset = 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Segments */}
            {list.map((item, idx) => {
              const fraction = item.count / total;
              const strokeDasharray = `${fraction * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset * circumference;
              accumulatedOffset += fraction;
              const color = PALETTE[idx % PALETTE.length];

              return (
                <circle
                  key={item.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              );
            })}
          </svg>

          {/* Center text in donut */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-navy)' }}>{total}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Washes</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {list.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: PALETTE[idx % PALETTE.length], flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{item.count}</span>
                <span style={{ background: '#F1F5F9', color: 'var(--text-muted)', fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-col gap-6" style={{ display: 'flex', width: '100%' }}>
      
      {/* Top Banner / Filter Card */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', borderLeft: '5px solid var(--primary-blue)', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary-navy)', fontWeight: 800 }}>
                Analytics & Insights Overview
              </h2>
              {refreshing && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                  <RefreshCw size={13} className="spin-animate" /> Refreshing...
                </span>
              )}
            </div>
            <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
              {activeRange.label} • {filteredBookings.length} bookings accounted for in this report
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Date Field Mode Toggle (Service Scheduled Date vs Booking Order Date) */}
            <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: '8px', padding: '0.2rem' }}>
              <button
                onClick={() => setDateField('serviceDate')}
                style={{
                  border: 'none',
                  background: dateField === 'serviceDate' ? 'white' : 'transparent',
                  color: dateField === 'serviceDate' ? 'var(--primary-navy)' : 'var(--text-muted)',
                  fontWeight: dateField === 'serviceDate' ? 700 : 500,
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: dateField === 'serviceDate' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Service Slot Date
              </button>
              <button
                onClick={() => setDateField('bookingDate')}
                style={{
                  border: 'none',
                  background: dateField === 'bookingDate' ? 'white' : 'transparent',
                  color: dateField === 'bookingDate' ? 'var(--primary-navy)' : 'var(--text-muted)',
                  fontWeight: dateField === 'bookingDate' ? 700 : 500,
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: dateField === 'bookingDate' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Order Placed Date
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', borderColor: '#CBD5E1', color: 'var(--text-main)' }}
              title="Refresh live data"
            >
              <RefreshCw size={15} className={refreshing ? 'spin-animate' : ''} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Date Presets Row */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-navy)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginRight: '0.4rem' }}>
              <Filter size={14} color="var(--primary-blue)" /> Range:
            </span>

            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: '7days', label: 'Last 7 Days' },
              { key: '30days', label: 'Last 30 Days' },
              { key: 'thisMonth', label: 'This Month' },
              { key: 'lastMonth', label: 'Last Month' },
              { key: 'custom', label: 'Custom' },
            ].map(tab => {
              const isActive = datePreset === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setDatePreset(tab.key)}
                  style={{
                    border: isActive ? '1px solid var(--primary-blue)' : '1px solid #E2E8F0',
                    background: isActive ? 'var(--primary-blue)' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 5px rgba(21, 101, 192, 0.25)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Status Quick Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto', marginBottom: 0, fontWeight: 600 }}
            >
              <option value="ALL">All Statuses ({bookings.length})</option>
              <option value="COMPLETED">Completed Only</option>
              <option value="ACTIVE">Active (Needs Work)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers Drawer */}
        {datePreset === 'custom' && (
          <div 
            className="animate-fade-in" 
            style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#F8FAFC', 
              borderRadius: '10px', 
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>From:</label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="form-input"
                style={{ width: '160px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', marginBottom: 0 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>To:</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="form-input"
                style={{ width: '160px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', marginBottom: 0 }}
              />
            </div>

            {(customStart || customEnd) && (
              <button
                onClick={() => { setCustomStart(''); setCustomEnd(''); }}
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderColor: '#CBD5E1' }}
              >
                Clear Dates
              </button>
            )}

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Showing {filteredBookings.length} matching bookings
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="card animate-fade-in" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '1rem 1.25rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B' }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Data Connection Notice: </strong>
                <span style={{ fontSize: '0.85rem' }}>{error}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => loadData(true)} 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderColor: '#EF4444', color: '#B91C1C' }}
              >
                <RefreshCw size={14} className={refreshing ? 'spin-animate' : ''} />
                <span>Retry Fetch</span>
              </button>
              {error.toLowerCase().includes('session') && (
                <button 
                  onClick={() => { localStorage.removeItem('adminToken'); localStorage.removeItem('adminInfo'); window.location.href='/'; }}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                >
                  Sign In Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && !refreshing && (
        <div className="card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--primary-navy)' }}>
          <RefreshCw size={20} className="spin-animate" color="var(--primary-blue)" />
          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Loading live bookings and analytics...</span>
        </div>
      )}

      {/* Primary KPI Overview Cards (Dynamic with Date Filter) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="card" style={{ borderTop: '4px solid var(--primary-blue)', position: 'relative', overflow: 'hidden' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted text-xs font-semibold uppercase tracking-wider">Filtered Revenue</span>
            <div style={{ background: 'var(--accent-teal-light)', color: 'var(--accent-teal)', padding: '0.55rem', borderRadius: '50%' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h1 style={{ fontSize: '2.1rem', margin: '0.1rem 0', color: 'var(--primary-navy)' }}>
            ₹{metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.82rem' }}>
            <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <TrendingUp size={14} /> {metrics.completedCount} Washes Completed
            </span>
            <span className="text-muted">Avg: ₹{Math.round(metrics.avgOrderValue)}</span>
          </div>
        </div>

        {/* Total Bookings Filtered */}
        <div className="card" style={{ borderTop: '4px solid var(--accent-teal)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted text-xs font-semibold uppercase tracking-wider">Bookings Volume</span>
            <div style={{ background: '#E0E7FF', color: '#4F46E5', padding: '0.55rem', borderRadius: '50%' }}>
              <Calendar size={20} />
            </div>
          </div>
          <h1 style={{ fontSize: '2.1rem', margin: '0.1rem 0', color: 'var(--primary-navy)' }}>
            {metrics.totalCount}
          </h1>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
              {metrics.completedCount} Done
            </span>
            <span className="badge badge-warning" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
              {metrics.activeCount} Active
            </span>
            {metrics.cancelledCount > 0 && (
              <span className="badge badge-danger" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
                {metrics.cancelledCount} Cancelled
              </span>
            )}
          </div>
        </div>

        {/* Active Bookings (Needing Dispatch / In Service) */}
        <div className="card" style={{ borderTop: '4px solid var(--warning)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted text-xs font-semibold uppercase tracking-wider">Active & In-Progress</span>
            <div style={{ background: '#FEF3C7', color: '#D97706', padding: '0.55rem', borderRadius: '50%' }}>
              <Clock size={20} />
            </div>
          </div>
          <h1 style={{ fontSize: '2.1rem', margin: '0.1rem 0', color: 'var(--primary-navy)' }}>
            {metrics.activeCount}
          </h1>
          <p className="text-sm" style={{ color: metrics.activeCount > 0 ? '#D97706' : '#64748B', fontWeight: 600, marginTop: '0.5rem' }}>
            {metrics.activeCount > 0 ? 'Requires employee assignment/service' : 'All jobs handled'}
          </p>
        </div>

        {/* Customer Satisfaction */}
        <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted text-xs font-semibold uppercase tracking-wider">Satisfaction & Rating</span>
            <div style={{ background: '#D1FAE5', color: '#059669', padding: '0.55rem', borderRadius: '50%' }}>
              <Star size={20} />
            </div>
          </div>
          <h1 style={{ fontSize: '2.1rem', margin: '0.1rem 0', color: 'var(--primary-navy)' }}>
            {metrics.avgRating}<span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/5</span>
          </h1>
          <p className="text-sm text-success flex items-center gap-1 mt-2" style={{ fontWeight: 600 }}>
            <ShieldCheck size={14} /> {metrics.completionRate}% Wash Completion Rate
          </p>
        </div>

      </div>

      {/* HIGHEST & LEAST INSIGHT CARDS (Wash Type, Car Type, Service Area) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={20} color="#F59E0B" /> Peak Demand & Under-Performing Insights
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Calculated across {filteredBookings.length} bookings in selected timeframe
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Wash Type Highlights */}
          <div className="card" style={{ border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.6rem' }}>
              <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.4rem', borderRadius: '8px' }}>
                <Sparkles size={18} />
              </div>
              <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                Wash Package Trends
              </h4>
            </div>

            {/* Highest Going Wash */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  👑 Highest Going Wash
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                  {washTypeStats.highest?.percentage || 0}% Share
                </span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-navy)', marginTop: '0.3rem' }}>
                {washTypeStats.highest?.name || 'No bookings'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.8rem', color: '#166534' }}>
                <span><strong>{washTypeStats.highest?.count || 0}</strong> bookings</span>
                <span><strong>₹{(washTypeStats.highest?.revenue || 0).toLocaleString()}</strong> generated</span>
              </div>
            </div>

            {/* Least Going Wash */}
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🔻 Least Going Wash
                </span>
                <span style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 700 }}>
                  {washTypeStats.least?.percentage || 0}% Share
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)', marginTop: '0.3rem' }}>
                {washTypeStats.least?.name || 'No data'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.8rem', color: '#9A3412' }}>
                <span><strong>{washTypeStats.least?.count || 0}</strong> bookings</span>
                <span>Avg: ₹{washTypeStats.least?.avgPrice || 0}</span>
              </div>
            </div>
          </div>

          {/* 2. Car Type Highlights */}
          <div className="card" style={{ border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.6rem' }}>
              <div style={{ background: '#EDE9FE', color: '#6366F1', padding: '0.4rem', borderRadius: '8px' }}>
                <Car size={18} />
              </div>
              <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                Vehicle Segment Trends
              </h4>
            </div>

            {/* Highest Going Car Type */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🚗 Highest Booked Car Type
                </span>
                <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                  {carTypeStats.highest?.percentage || 0}% Share
                </span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-navy)', marginTop: '0.3rem' }}>
                {carTypeStats.highest?.name || 'No bookings'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.8rem', color: '#1E40AF' }}>
                <span><strong>{carTypeStats.highest?.count || 0}</strong> cars washed</span>
                <span><strong>₹{(carTypeStats.highest?.revenue || 0).toLocaleString()}</strong> total</span>
              </div>
            </div>

            {/* Least Going Car Type */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🔻 Least Booked Car Type
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>
                  {carTypeStats.least?.percentage || 0}% Share
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)', marginTop: '0.3rem' }}>
                {carTypeStats.least?.name || 'No data'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.8rem', color: '#64748B' }}>
                <span><strong>{carTypeStats.least?.count || 0}</strong> cars</span>
                <span>Avg: ₹{carTypeStats.least?.avgPrice || 0}</span>
              </div>
            </div>
          </div>

          {/* 3. Service Area / Zone Highlights */}
          <div className="card" style={{ border: '1px solid #E2E8F0', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.6rem' }}>
              <div style={{ background: '#FEF3C7', color: '#D97706', padding: '0.4rem', borderRadius: '8px' }}>
                <MapPin size={18} />
              </div>
              <h4 style={{ margin: 0, color: 'var(--primary-navy)', fontSize: '1.05rem', fontWeight: 700 }}>
                Area / Zone Demand
              </h4>
            </div>

            {/* Highest Bookings Area Zone */}
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📍 Top Booking Zone
                </span>
                <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                  {areaStats.highest?.percentage || 0}% Density
                </span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-navy)', marginTop: '0.3rem' }}>
                {areaStats.highest?.name || 'No zone bookings'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.8rem', color: '#B91C1C' }}>
                <span><strong>{areaStats.highest?.count || 0}</strong> bookings dispatched</span>
                <span><strong>₹{(areaStats.highest?.revenue || 0).toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Least Booking Area Zone */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🔻 Least Booking Zone
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>
                  {areaStats.least?.percentage || 0}% Share
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-navy)', marginTop: '0.3rem' }}>
                {areaStats.least?.name || 'No data'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.8rem', color: '#64748B' }}>
                <span><strong>{areaStats.least?.count || 0}</strong> bookings</span>
                <span>Status: <span style={{ color: '#D97706', fontWeight: 600 }}>Low Volume</span></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CHARTS SECTION: Timeline Trend + Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Timeline Trend Chart */}
        <div className="card lg:col-span-2" style={{ border: '1px solid #E2E8F0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={20} color="var(--primary-blue)" /> Performance Trend Timeline
              </h3>
              <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
                Chronological pattern of {trendMetric === 'revenue' ? 'earnings (₹)' : 'daily wash volume'}
              </p>
            </div>

            {/* Metric Switcher */}
            <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: '8px', padding: '0.2rem' }}>
              <button
                onClick={() => setTrendMetric('revenue')}
                style={{
                  border: 'none',
                  background: trendMetric === 'revenue' ? 'var(--primary-navy)' : 'transparent',
                  color: trendMetric === 'revenue' ? '#FFFFFF' : 'var(--text-main)',
                  fontWeight: trendMetric === 'revenue' ? 700 : 500,
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setTrendMetric('bookings')}
                style={{
                  border: 'none',
                  background: trendMetric === 'bookings' ? 'var(--primary-navy)' : 'transparent',
                  color: trendMetric === 'bookings' ? '#FFFFFF' : 'var(--text-main)',
                  fontWeight: trendMetric === 'bookings' ? 700 : 500,
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Booking Count
              </button>
            </div>
          </div>

          {/* Interactive SVG Trend Chart */}
          {renderTrendChart()}

          {/* Chart footer stats */}
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Timeline Points</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>{trendData.length} Days</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Period Revenue</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>₹{metrics.totalRevenue.toLocaleString()}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Daily Washes</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                {trendData.length > 0 ? (filteredBookings.length / trendData.length).toFixed(1) : 0}
              </div>
            </div>
          </div>
        </div>

        {/* Wash Packages Donut & Share Chart */}
        <div className="card" style={{ border: '1px solid #E2E8F0', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={20} color="var(--accent-teal)" /> Packages Share
            </h3>
            <span style={{ fontSize: '0.75rem', background: '#E0F2FE', color: '#0369A1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
              {washTypeStats.list.length} Plans
            </span>
          </div>

          {renderWashDonutChart()}
        </div>

      </div>

      {/* FULL DETAILED OVERVIEW BREAKDOWNS (Tabbed: Wash Types, Car Types, Service Zones) */}
      <div className="card" style={{ border: '1px solid #E2E8F0', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontWeight: 800 }}>
              Full Details & Segment Rankings
            </h3>
            <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
              Deep comparative statistics ordered from highest to least
            </p>
          </div>

          {/* Segment Selector Tabs */}
          <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: '8px', padding: '0.25rem' }}>
            <button
              onClick={() => setActiveSegmentTab('washes')}
              style={{
                border: 'none',
                background: activeSegmentTab === 'washes' ? 'white' : 'transparent',
                color: activeSegmentTab === 'washes' ? 'var(--primary-navy)' : 'var(--text-muted)',
                fontWeight: activeSegmentTab === 'washes' ? 700 : 500,
                fontSize: '0.82rem',
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeSegmentTab === 'washes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Wash Packages ({washTypeStats.list.length})
            </button>
            <button
              onClick={() => setActiveSegmentTab('cars')}
              style={{
                border: 'none',
                background: activeSegmentTab === 'cars' ? 'white' : 'transparent',
                color: activeSegmentTab === 'cars' ? 'var(--primary-navy)' : 'var(--text-muted)',
                fontWeight: activeSegmentTab === 'cars' ? 700 : 500,
                fontSize: '0.82rem',
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeSegmentTab === 'cars' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Car Classes ({carTypeStats.list.length})
            </button>
            <button
              onClick={() => setActiveSegmentTab('zones')}
              style={{
                border: 'none',
                background: activeSegmentTab === 'zones' ? 'white' : 'transparent',
                color: activeSegmentTab === 'zones' ? 'var(--primary-navy)' : 'var(--text-muted)',
                fontWeight: activeSegmentTab === 'zones' ? 700 : 500,
                fontSize: '0.82rem',
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeSegmentTab === 'zones' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Service Zones ({areaStats.list.length})
            </button>
          </div>
        </div>

        {/* TAB 1: WASH TYPES BREAKDOWN TABLE */}
        {activeSegmentTab === 'washes' && (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Rank & Wash Package</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Volume Share</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Bookings Count</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Revenue Generated</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Avg Ticket</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Demand Badge</th>
                </tr>
              </thead>
              <tbody>
                {washTypeStats.list.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: idx === 0 ? '#FEF3C7' : (idx === washTypeStats.list.length - 1 ? '#F1F5F9' : '#EFF6FF'), 
                          color: idx === 0 ? '#D97706' : (idx === washTypeStats.list.length - 1 ? '#64748B' : '#1D4ED8'),
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{item.name}</div>
                          {item.quickByte && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.quickByte}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', width: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: '#E2E8F0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.percentage}%`, height: '100%', background: idx === 0 ? 'var(--success)' : 'var(--primary-blue)', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', width: '32px' }}>{item.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--primary-navy)' }}>
                      {item.count}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                      ₹{item.revenue.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      ₹{item.avgPrice}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      {idx === 0 ? (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>🔥 Highest Going</span>
                      ) : idx === washTypeStats.list.length - 1 ? (
                        <span style={{ background: '#FFF7ED', color: '#9A3412', border: '1px solid #FED7AA', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          🔻 Least Going
                        </span>
                      ) : (
                        <span style={{ background: '#F1F5F9', color: 'var(--text-muted)', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          Standard
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CAR TYPES BREAKDOWN TABLE */}
        {activeSegmentTab === 'cars' && (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Rank & Vehicle Type</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Share of Fleet</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Total Washes</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Market Position</th>
                </tr>
              </thead>
              <tbody>
                {carTypeStats.list.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: idx === 0 ? '#EFF6FF' : '#F8FAFC', 
                          color: idx === 0 ? '#1D4ED8' : '#64748B',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          #{idx + 1}
                        </span>
                        <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{item.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', width: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: '#E2E8F0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.percentage}%`, height: '100%', background: idx === 0 ? '#6366F1' : 'var(--accent-teal)', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', width: '32px' }}>{item.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--primary-navy)' }}>
                      {item.count}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                      ₹{item.revenue.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      {idx === 0 ? (
                        <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          🚗 Highest Booked Car Type
                        </span>
                      ) : idx === carTypeStats.list.length - 1 ? (
                        <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          🔻 Least Booked Car Type
                        </span>
                      ) : (
                        <span style={{ background: '#F8FAFC', color: 'var(--text-muted)', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          Moderate Share
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: SERVICE AREAS BREAKDOWN TABLE */}
        {activeSegmentTab === 'zones' && (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Rank & Zone Name</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Geographic Share</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Bookings Assigned</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Zone Revenue</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Demand Classification</th>
                </tr>
              </thead>
              <tbody>
                {areaStats.list.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: idx === 0 ? '#FEF2F2' : '#F8FAFC', 
                          color: idx === 0 ? '#B91C1C' : '#64748B',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', width: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: '#E2E8F0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.percentage}%`, height: '100%', background: idx === 0 ? '#EF4444' : '#F59E0B', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', width: '32px' }}>{item.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--primary-navy)' }}>
                      {item.count}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                      ₹{item.revenue.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      {idx === 0 ? (
                        <span style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          🔥 Highest Bookings Area Zone
                        </span>
                      ) : idx === areaStats.list.length - 1 ? (
                        <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          💤 Least Booking Area Zone
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          Active Zone
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* LATEST 5 BOOKINGS SECTION (Properly Shown & Functional) */}
      <div className="card" style={{ border: '1px solid #E2E8F0', padding: '0' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--primary-navy)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary-blue)" /> Latest 5 Bookings
            </h3>
            <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
              Real-time feed of the most recently placed car wash appointments
            </p>
          </div>

          <Link
            to="/bookings"
            className="btn btn-outline"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>View All Bookings</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Booking ID</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Customer Details</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle & Package</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Schedule & Area</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Amount & Status</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestFiveBookings.map((b) => {
                const bookingRef = b.bookingId || `WMC-${b.id}`;
                const carDesc = [b.carMake, b.carModel].filter(Boolean).join(' ') || (b.car && [b.car.make, b.car.model].filter(Boolean).join(' ')) || 'Customer Car';
                const carTypeName = (b.carType && b.carType.name) || 'Standard';
                const washTypeName = (b.washType && b.washType.name) || 'Wash Package';
                const areaName = (b.serviceArea && b.serviceArea.name) || 'Zone';

                return (
                  <tr 
                    key={b.id} 
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    className="hover:bg-gray-50"
                  >
                    {/* Booking ID */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 700, 
                          color: '#1D4ED8', 
                          background: '#EFF6FF', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '5px',
                          border: '1px solid #DBEAFE',
                          fontSize: '0.8rem'
                        }}>
                          {bookingRef}
                        </span>
                        <button
                          onClick={() => handleCopyId(bookingRef)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.2rem', color: 'var(--text-muted)' }}
                          title="Copy reference code"
                        >
                          {copiedId === bookingRef ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Placed: {formatDateDMY(b.createdAt)}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.9rem' }}>
                        {b.user?.name || 'Guest User'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                        <Phone size={12} /> {b.user?.phone || 'No phone'}
                      </div>
                    </td>

                    {/* Vehicle & Wash Package */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-navy)', fontSize: '0.88rem' }}>
                          {carDesc}
                        </span>
                        <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          {carTypeName}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.25rem' }}>
                        <span style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          ✨ {washTypeName}
                        </span>
                      </div>
                    </td>

                    {/* Schedule & Area */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        📅 {formatDateDMY(b.date)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        ⏰ {b.timeSlot || 'Flexible'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                        <MapPin size={12} /> {areaName}
                      </div>
                    </td>

                    {/* Amount & Status */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                        ₹{Number(b.price || 0).toLocaleString()}
                      </div>
                      <div style={{ marginTop: '0.3rem' }}>
                        {getStatusBadge(b.status)}
                      </div>
                    </td>

                    {/* Quick Action Button */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: '#CBD5E1', color: 'var(--primary-blue)' }}
                      >
                        <Eye size={14} /> Quick View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {latestFiveBookings.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No bookings logged in the system yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK VIEW BOOKING MODAL */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(13, 38, 80, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '540px', background: 'white', padding: '1.75rem', borderRadius: 'var(--radius-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Booking Snapshot</span>
                <h3 style={{ margin: '0.1rem 0 0', color: 'var(--primary-navy)', fontFamily: 'monospace' }}>
                  {selectedBooking.bookingId || `WMC-${selectedBooking.id}`}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)} 
                className="btn btn-outline" 
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.85rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Status Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Booking Status</span>
                  <div style={{ marginTop: '0.2rem' }}>{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Payable</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)' }}>₹{Number(selectedBooking.price || 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Grid 2-col Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Customer</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{selectedBooking.user?.name || 'Customer'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedBooking.user?.phone}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vehicle</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                    {[selectedBooking.carMake, selectedBooking.carModel].filter(Boolean).join(' ') || 'Standard Car'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                    {selectedBooking.carType?.name} {selectedBooking.carNumber ? `(${selectedBooking.carNumber})` : ''}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Package</span>
                  <div style={{ fontWeight: 700, color: '#0284C7' }}>{selectedBooking.washType?.name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Schedule</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{formatDateDMY(selectedBooking.date)}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedBooking.timeSlot}</div>
                </div>
              </div>

              {/* Service Address */}
              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={13} color="var(--primary-blue)" /> Location & Service Area
                </span>
                <div style={{ fontWeight: 700, color: 'var(--primary-navy)', marginTop: '0.3rem' }}>
                  {selectedBooking.serviceArea?.name || 'Unassigned Zone'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {selectedBooking.address || 'Address coordinates on file'}
                </div>
              </div>

              {/* Assigned Technician */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.85rem', background: '#F1F5F9', borderRadius: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Employee:</span>
                <span style={{ fontWeight: 700, color: selectedBooking.employee ? 'var(--primary-navy)' : '#D97706' }}>
                  {selectedBooking.employee ? selectedBooking.employee.name : 'Not Yet Assigned'}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Link
                  to="/bookings"
                  className="btn btn-primary"
                  style={{ flex: 1, textDecoration: 'none' }}
                  onClick={() => setSelectedBooking(null)}
                >
                  Manage in Bookings Page →
                </Link>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="btn btn-outline"
                  style={{ borderColor: '#CBD5E1' }}
                >
                  Dismiss
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Embedded Animations CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animate {
          animation: spin 1s linear infinite;
        }
        tr.hover\\:bg-gray-50:hover {
          background-color: #F8FAFC;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
