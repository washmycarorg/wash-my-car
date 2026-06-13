import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, Bell, Search, DollarSign, Briefcase, FileText, Tag, Menu, X } from 'lucide-react';
import { loginAdmin, getStats, getEmployees, toggleEmployeeStatus } from './api';

import Bookings from './pages/Bookings';
import Financials from './pages/Financials';
import LeaveApprovals from './pages/LeaveApprovals';
import Services from './pages/Services';
import Offers from './pages/Offers'; // We need to create this

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`} style={{zIndex: 50}}>
        <div className="flex items-center justify-between" style={{marginBottom: '2rem'}}>
          <Link to="/" className="nav-brand flex items-center gap-2">
            <div style={{color: 'var(--accent-teal)', fontWeight: 'bold', fontSize: '1.25rem'}}>ADMIN</div>
            <span style={{color: 'white', fontWeight: 'bold', fontSize: '1.25rem'}}>PANEL</span>
          </Link>
          <button className="md-hidden text-white btn-close" onClick={() => setIsMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-col flex gap-2">
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/employees" className={`sidebar-link ${isActive('/employees')}`}>
            <Users size={20} /> Employees
          </Link>
          <Link to="/bookings" className={`sidebar-link ${isActive('/bookings')}`}>
            <Calendar size={20} /> Bookings & Slots
          </Link>
          <Link to="/earnings" className={`sidebar-link ${isActive('/earnings')}`}>
            <DollarSign size={20} /> Financials
          </Link>
          <Link to="/leaves" className={`sidebar-link ${isActive('/leaves')}`}>
            <FileText size={20} /> Leave Approvals
          </Link>
          <Link to="/services" className={`sidebar-link ${isActive('/services')}`}>
            <Briefcase size={20} /> Packages & Plans
          </Link>
          <Link to="/offers" className={`sidebar-link ${isActive('/offers')}`}>
            <Tag size={20} /> Offers
          </Link>
          <Link to="/settings" className={`sidebar-link ${isActive('/settings')}`}>
            <Settings size={20} /> Settings
          </Link>
          
          <div style={{marginTop: 'auto', paddingTop: '2rem'}}>
            <button className="btn btn-outline btn-block text-white" style={{borderColor: 'rgba(255,255,255,0.2)'}} onClick={() => { localStorage.removeItem('adminToken'); window.location.href='/'; }}>
              Log Out
            </button>
          </div>
        </nav>
      </aside>
      
      {/* Required CSS to make sidebar work on mobile */}
      <style>{`
        .sidebar.mobile-open {
          display: flex;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
        }
        @media (max-width: 768px) {
          .md-hidden { display: block; background: transparent; border: none; cursor: pointer; }
        }
        @media (min-width: 769px) {
          .md-hidden { display: none; }
        }
      `}</style>
    </>
  );
};

const Header = ({ title, setIsMobileOpen }) => (
  <header style={{background: 'var(--bg-white)', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, position: 'sticky', top: 0}}>
    <div className="flex items-center gap-4">
      <button className="md-hidden" style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem'}} onClick={() => setIsMobileOpen(true)}>
        <Menu size={24} color="var(--text-dark)" />
      </button>
      <h2 style={{margin: 0, fontSize: '1.5rem'}}>{title}</h2>
    </div>
    
    <div className="flex items-center gap-4">
      <div style={{position: 'relative'}} className="hidden md-block">
        <Search size={20} style={{position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)'}} />
        <input type="text" className="form-input" placeholder="Search..." style={{paddingLeft: '2.5rem', width: '250px', marginBottom: 0}} />
      </div>
      <Bell size={24} color="var(--text-muted)" style={{cursor: 'pointer'}} />
      <div style={{width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>A</div>
    </div>
    
    <style>{`
      @media (max-width: 768px) {
        .hidden\\.md-block { display: none; }
      }
    `}</style>
  </header>
);

const AdminLayout = ({ children, title }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  return (
    <div className="dashboard-layout animate-fade-in">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="main-content flex-col" style={{padding: 0, height: '100vh', overflowY: 'auto'}}>
        <Header title={title} setIsMobileOpen={setIsMobileOpen} />
        <main style={{padding: '2rem', flex: 1}}>
          {children}
        </main>
      </div>
    </div>
  );
};

const AdminLogin = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginAdmin(email, password);
      setAuth(true);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in" style={{background: 'var(--bg-main)'}}>
      <div className="card" style={{width: '100%', maxWidth: '400px', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)'}}>
        <h2 className="text-center" style={{marginBottom: '0.5rem'}}>Admin Portal</h2>
        <p className="text-center text-muted" style={{marginBottom: '2rem'}}>Sign in to manage Wash My Car</p>
        
        {error && <div className="badge badge-danger mb-4 w-full justify-center" style={{padding: '0.75rem', marginBottom: '1rem'}}>{error}</div>}
        
        <form className="flex-col flex gap-4" onSubmit={handleLogin}>
          <div className="form-group" style={{margin: 0}}>
            <label className="form-label">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="form-input" placeholder="admin@washmycar.com" required />
          </div>
          <div className="form-group" style={{margin: 0}}>
            <label className="form-label">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
          </div>
          <div className="flex justify-between items-center" style={{marginTop: '-0.5rem'}}>
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="text-sm text-blue" onClick={(e) => {e.preventDefault(); alert("Forgot password functionality coming soon!");}}>Forgot password?</a>
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{marginTop: '0.5rem'}}>Sign In</button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => { getStats().then(setStats).catch(console.error); }, []);

  return (
    <AdminLayout title="Overview Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card" style={{borderTop: '4px solid var(--primary-blue)'}}>
           <div className="flex justify-between items-center mb-4">
             <p className="text-muted text-sm font-semibold uppercase">Total Revenue</p>
             <div style={{background: 'var(--accent-teal-light)', color: 'var(--accent-teal)', padding: '0.5rem', borderRadius: '50%'}}>
               <DollarSign size={20} />
             </div>
           </div>
           <h1>${stats?.totalRevenue || 0}</h1>
           <p className="text-sm text-success flex items-center gap-1 mt-2">↑ 12% from last month</p>
        </div>
        
        <div className="card" style={{borderTop: '4px solid var(--accent-teal)'}}>
           <div className="flex justify-between items-center mb-4">
             <p className="text-muted text-sm font-semibold uppercase">Active Bookings</p>
             <div style={{background: '#E0E7FF', color: '#4F46E5', padding: '0.5rem', borderRadius: '50%'}}>
               <Calendar size={20} />
             </div>
           </div>
           <h1>{stats?.activeBookings || 0}</h1>
           <p className="text-sm text-success flex items-center gap-1 mt-2">Needs Assignment</p>
        </div>
        
        <div className="card" style={{borderTop: '4px solid var(--success)'}}>
           <div className="flex justify-between items-center mb-4">
             <p className="text-muted text-sm font-semibold uppercase">Employees Online</p>
             <div style={{background: '#D1FAE5', color: '#059669', padding: '0.5rem', borderRadius: '50%'}}>
               <Users size={20} />
             </div>
           </div>
           <h1>{stats?.employeesOnline || 0}</h1>
           <p className="text-sm text-muted mt-2">Available for duty</p>
        </div>
        
        <div className="card" style={{borderTop: '4px solid var(--warning)'}}>
           <div className="flex justify-between items-center mb-4">
             <p className="text-muted text-sm font-semibold uppercase">Customer Satisfaction</p>
             <div style={{background: '#FEF3C7', color: '#D97706', padding: '0.5rem', borderRadius: '50%'}}>
               <Search size={20} />
             </div>
           </div>
           <h1>4.8<span style={{fontSize: '1.25rem', color: 'var(--text-muted)'}}>/5</span></h1>
           <p className="text-sm text-success mt-2">↑ 0.2 from last week</p>
        </div>
      </div>
      
      {/* Placeholder for charts or recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3>Revenue Overview</h3>
          <div style={{height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '0.5rem', marginTop: '1rem', border: '1px dashed #CBD5E1'}}>
            <p className="text-muted">Chart visualization goes here</p>
          </div>
        </div>
        <div className="card">
          <h3>Recent Activity</h3>
          <div className="flex-col gap-4 mt-4" style={{display: 'flex'}}>
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-3 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div style={{width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-teal-light)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                  <Bell size={16} />
                </div>
                <div>
                  <p style={{fontWeight: 500, fontSize: '0.9rem'}}>New booking received</p>
                  <p className="text-muted text-sm">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  
  const fetchEmployees = () => getEmployees().then(setEmployees).catch(console.error);
  useEffect(() => { fetchEmployees(); }, []);

  const handleToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await toggleEmployeeStatus(id, newStatus);
      fetchEmployees();
    } catch (err) { console.error(err); }
  };

  return (
    <AdminLayout title="Employee Details & Stats">
      <div className="card" style={{padding: 0, overflowX: 'auto'}}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 style={{margin: 0}}>All Employees</h3>
          <button className="btn btn-primary">+ Add Employee</button>
        </div>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px'}}>
          <thead style={{background: '#F8FAFC'}}>
            <tr>
              <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Name</th>
              <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Contact</th>
              <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Salary / Cost</th>
              <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Status</th>
              <th style={{padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s'}} className="hover:bg-gray-50">
                <td style={{padding: '1rem 1.5rem'}}>
                  <div style={{fontWeight: 600, color: 'var(--primary-navy)'}}>{emp.name}</div>
                  <div style={{fontSize: '0.8rem'}} className={emp.onDuty ? 'text-success' : 'text-muted'}>{emp.onDuty ? '● On Duty' : '○ Off Duty'}</div>
                </td>
                <td style={{padding: '1rem 1.5rem'}}>
                  <div style={{color: 'var(--text-main)', fontSize: '0.9rem'}}>{emp.phone}</div>
                  <div style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>{emp.email}</div>
                </td>
                <td style={{padding: '1rem 1.5rem'}}>
                  <div style={{fontWeight: 600}}>${emp.salary || 0}</div>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>per month</div>
                </td>
                <td style={{padding: '1rem 1.5rem'}}>
                  <span className={`badge ${emp.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                    {emp.status}
                  </span>
                </td>
                <td style={{padding: '1rem 1.5rem'}} className="flex gap-2">
                  {emp.status === 'ACTIVE' ? 
                    <button onClick={() => handleToggle(emp.id, emp.status)} className="btn btn-outline" style={{padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderColor: 'var(--danger)', color: 'var(--danger)'}}>Suspend</button> :
                    <button onClick={() => handleToggle(emp.id, emp.status)} className="btn btn-teal" style={{padding: '0.4rem 0.8rem', fontSize: '0.85rem'}}>Approve</button>
                  }
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan="5" style={{padding: '3rem', textAlign: 'center', color: 'var(--text-muted)'}}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Require basic Tailwind-like hover classes for table rows */}
      <style>{`
        tr.hover\\:bg-gray-50:hover { background-color: #F8FAFC; }
      `}</style>
    </AdminLayout>
  );
};

const App = () => {
  const [auth, setAuth] = useState(!!localStorage.getItem('adminToken'));
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={auth ? <Navigate to="/dashboard"/> : <AdminLogin setAuth={setAuth} />} />
        <Route path="/dashboard" element={auth ? <Dashboard /> : <Navigate to="/"/>} />
        <Route path="/employees" element={auth ? <EmployeeManagement /> : <Navigate to="/"/>} />
        <Route path="/bookings" element={auth ? <AdminLayout title="Slots Details & Assignment"><Bookings /></AdminLayout> : <Navigate to="/"/>} />
        <Route path="/earnings" element={auth ? <AdminLayout title="Earnings & Cost to Company"><Financials /></AdminLayout> : <Navigate to="/"/>} />
        <Route path="/leaves" element={auth ? <AdminLayout title="Leave Approval"><LeaveApprovals /></AdminLayout> : <Navigate to="/"/>} />
        <Route path="/services" element={auth ? <AdminLayout title="Packages & Plans"><Services /></AdminLayout> : <Navigate to="/"/>} />
        <Route path="/offers" element={auth ? <AdminLayout title="Execute Offers"><Offers /></AdminLayout> : <Navigate to="/"/>} />
        <Route path="/settings" element={auth ? <AdminLayout title="System Settings"><div className="card p-8">Settings (In Development)</div></AdminLayout> : <Navigate to="/"/>} />
      </Routes>
    </Router>
  );
};

export default App;
