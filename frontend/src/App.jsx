import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MonitorPlay, Activity, Bell, LogOut } from 'lucide-react';
import Reception from './pages/Reception';
import TVDisplay from './pages/TVDisplay'; 
import Analytics from './pages/Analytics';
import Login from './pages/Login'; // 🚀 NAYA: Login page import kiya

// 🛡️ NAYA: Security Guard Wrapper (Bina login ke dashboard nahi khulega)
const ProtectedRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Sidebar = () => (
  <div className="w-64 bg-cyan-950 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-cyan-900 shadow-2xl">
    <div className="p-6 flex items-center gap-3 border-b border-cyan-900/50">
      <div className="bg-teal-500 p-2 rounded-lg shadow-lg shadow-teal-500/20">
        <Activity size={24} className="text-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-wider text-white">FlowCare</h1>
        <p className="text-xs text-teal-300 font-bold tracking-widest uppercase mt-1">Smart OPD</p>
      </div>
    </div>
    <nav className="flex-1 p-4 space-y-2 mt-4">
      <NavLink to="/reception" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-900/50' : 'text-cyan-200/60 hover:bg-cyan-900 hover:text-white'}`}>
        <LayoutDashboard size={20} />
        <span className="font-medium">Reception</span>
      </NavLink>
      <NavLink to="/tv" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-900/50' : 'text-cyan-200/60 hover:bg-cyan-900 hover:text-white'}`}>
        <MonitorPlay size={20} />
        <span className="font-medium">TV Display</span>
      </NavLink>
      <NavLink to="/analytics" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-900/50' : 'text-cyan-200/60 hover:bg-cyan-900 hover:text-white'}`}>
        <Activity size={20} />
        <span className="font-medium">Analytics</span>
      </NavLink>
    </nav>
  </div>
);

const TopHeader = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // 🚀 NAYA: Logged-in user ka data fetch karna
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userInitial = userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    localStorage.removeItem('userInfo'); // Token hatao
    navigate('/login'); // Wapas login page par bhejo
  };

  return (
    <header className="h-20 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border-b border-slate-200/50 flex items-center justify-between px-8 sticky top-0 z-50 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">OPD Control Center</h2>
        <p className="text-sm font-semibold text-slate-500">Manage daily patient flow and emergencies</p>
      </div>
      <div className="flex items-center gap-6 relative">
        <div className="flex items-center gap-2 bg-emerald-50/80 px-4 py-2 rounded-full border border-emerald-100 shadow-sm backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live Sync</span>
        </div>
        <button className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        {/* 🚀 NAYA: Interactive Profile Icon */}
        <div 
          onClick={() => setShowDropdown(!showDropdown)}
          className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 border-2 border-white shadow-md flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-all hover:scale-105"
        >
          {userInitial}
        </div>

        {/* 🚀 NAYA: Profile Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-14 right-0 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-4 border-b border-slate-50 bg-slate-50/50">
              <p className="text-sm font-black text-slate-800 truncate">{userInfo?.name || 'User'}</p>
              <p className="text-xs font-bold text-slate-400 truncate mt-0.5">{userInfo?.email || 'admin@flowcare.com'}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-widest rounded-md">
                {userInfo?.role || 'Staff'}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} /> Secure Logout
            </button>
          </div>
        )}

      </div>
    </header>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50/50 font-sans flex">
        <Routes>
          {/* Public Routes (Bina login khulenge) */}
          <Route path="/login" element={<Login />} />
          <Route path="/tv" element={<TVDisplay />} />
          
          {/* Protected Routes (Bina login nahi khulenge) */}
          <Route path="*" element={
            <ProtectedRoute>
              <Sidebar />
              <div className="flex-1 ml-64 flex flex-col">
                <TopHeader />
                <main className="p-8">
                  <Routes>
                    <Route path="/" element={<Navigate to="/reception" replace />} />
                    <Route path="/reception" element={<Reception />} />
                    <Route path="/analytics" element={<Analytics />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;