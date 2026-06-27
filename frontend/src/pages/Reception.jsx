import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  UserPlus, AlertCircle, ChevronRight, Users, Clock, Flame, 
  RotateCcw, Search, Filter, Ban, RefreshCw, CheckCircle2, ShieldAlert,
  ClipboardList, HeartPulse, User, Phone
} from 'lucide-react';

const Reception = () => {
  // Core States
  const [queue, setQueue] = useState([]);
  const [currentToken, setCurrentToken] = useState(0);
  const [avgWait, setAvgWait] = useState(0);
  
  // Enterprise UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [isResetting, setIsResetting] = useState(false);
  const [servingPatientDetails, setServingPatientDetails] = useState(null);

  // ADVANCED KIOSK FORM STATES
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientContact, setPatientContact] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [priority, setPriority] = useState('normal');
  const [symptoms, setSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = 'https://flowcare-opd.onrender.com/api';

  useEffect(() => {
    fetchQueueStatus();
    const socket = io('https://flowcare-opd.onrender.com');
    
    socket.on('queueUpdated', fetchQueueStatus);
    socket.on('callNext', (data) => {
      setCurrentToken(data.currentToken);
      fetchQueueStatus();
    });
    socket.on('settingsUpdated', (data) => setAvgWait(data.avgConsultationTime));
    
    return () => socket.disconnect();
  }, []);

  const fetchQueueStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/queue`);
      setQueue(res.data.queue);
      setCurrentToken(res.data.currentToken);
      setAvgWait(res.data.avgConsultationTime || 10);
      
      const serving = res.data.queue.find(p => p.status === 'serving');
      setServingPatientDetails(serving || null);
    } catch (error) {
      console.error("Error fetching queue:", error);
    }
  };

  const generateToken = async (type) => {
    try {
      const endpoint = type === 'emergency' ? '/token/emergency' : '/token';
      await axios.post(`${API_URL}${endpoint}`);
    } catch (error) {
      console.error("Error generating token:", error);
    }
  };

  const callNextPatient = async () => {
    try {
      await axios.post(`${API_URL}/call-next`);
    } catch (error) {
      console.error("Error calling next:", error);
    }
  };

  const skipPatient = async (tokenNumber) => {
    try {
      await axios.post(`${API_URL}/skip`, { tokenNumber });
      fetchQueueStatus();
    } catch (error) {
      console.error("Error skipping token:", error);
    }
  };

  const recallPatient = async (tokenNumber) => {
    try {
      await axios.post(`${API_URL}/recall`, { tokenNumber });
      fetchQueueStatus();
    } catch (error) {
      console.error("Error recalling token:", error);
    }
  };

  const resetFullQueue = async () => {
    if (window.confirm("CRITICAL ACTION: Kya aap sach me aaj ki poori queue reset karna chahte hain? Ye data clear kar dega.")) {
      try {
        setIsResetting(true);
        console.log("Resetting full queue system...");
        setTimeout(() => setIsResetting(false), 1000);
      } catch (error) {
        console.error("Reset failed:", error);
        setIsResetting(false);
      }
    }
  };

  // Advanced Form Submission Logic
  const handleAdvancedRegister = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/queue/add`, {
        name: patientName.trim(),
        priority,
        department,
        age: patientAge,
        gender: patientGender,
        contact: patientContact,
        symptoms: symptoms.trim()
      });

      // Clear Form Fields
      setPatientName('');
      setPatientAge('');
      setPatientGender('Male');
      setPatientContact('');
      setDepartment('General Medicine');
      setPriority('normal');
      setSymptoms('');
      
      fetchQueueStatus();
    } catch (error) {
      console.error("Advanced Registration Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWaiting = queue.filter(q => q.status === 'waiting').length;
  const emergencyCount = queue.filter(q => q.priority === 'high' && q.status === 'waiting').length;
  const skippedCount = queue.filter(q => q.status === 'skipped').length;

  const filteredQueue = queue.filter(patient => {
    const matchesSearch = patient.tokenNumber.toString().includes(searchTerm);
    if (statusFilter === 'high') return matchesSearch && patient.priority === 'high' && patient.status === 'waiting';
    if (statusFilter === 'waiting') return matchesSearch && patient.status === 'waiting';
    if (statusFilter === 'skipped') return matchesSearch && patient.status === 'skipped';
    return matchesSearch && (patient.status === 'waiting' || patient.status === 'skipped');
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* SECTION 1: TOP METRICS ROW (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Users size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Waiting Patients</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalWaiting} Active</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Clock size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Est. Delay</p>
            <h3 className="text-2xl font-bold text-slate-800">~{avgWait * totalWaiting} mins</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Flame size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Critical Alerts</p>
            <h3 className="text-2xl font-bold text-red-600">{emergencyCount} Urgent</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Ban size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skipped Tokens</p>
            <h3 className="text-2xl font-bold text-slate-700">{skippedCount} On Hold</h3>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MODULE 1: NOW SERVING COMMAND PANEL */}
          <div className="rounded-3xl p-8 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 shadow-xl border border-slate-800">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h2 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Doctor Consultation Active</h2>
                </div>
                <div className="text-white flex items-baseline gap-4">
                  <span className="text-3xl font-light text-slate-500">Serving:</span>
                  <span className="text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-teal-200">
                    {currentToken > 0 ? `#${currentToken}` : 'IDLE'}
                  </span>
                </div>
                {servingPatientDetails && (
                  <p className="text-xs text-slate-400 font-medium bg-slate-800/60 px-3 py-1.5 rounded-lg inline-block border border-slate-800">
                    Called at: {new Date(servingPatientDetails.calledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                    {servingPatientDetails.priority === 'high' && <span className="text-red-400 ml-2 font-bold">⚠️ EMERGENCY BUILD</span>}
                  </p>
                )}
              </div>
              
              <button 
                onClick={callNextPatient}
                className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg shadow-teal-600/20 group border border-teal-500"
              >
                Next Patient <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* ADVANCED PATIENT INTAKE FORM (Clean & Medium Size) */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Patient Registration Desk</h3>
                  <p className="text-xs font-semibold text-slate-400">Fill details to generate a new queue token</p>
                </div>
              </div>
              <span className="hidden md:inline-flex bg-teal-50 text-teal-700 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider">
                Live Registration
              </span>
            </div>

            {/* Form Section takes full width of the card now, looking cleaner */}
            <form onSubmit={handleAdvancedRegister} className="space-y-5">
              
              {/* Row 1: Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={12} /> Patient Full Name</label>
                <input 
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient full name..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-teal-500 transition-all shadow-inner"
                />
              </div>

              {/* Row 2: Age, Gender & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age (Years)</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="Eg. 28"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-teal-500 transition-all shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Phone size={11} /> Contact No.</label>
                  <input 
                    type="tel"
                    required
                    maxLength="10"
                    value={patientContact}
                    onChange={(e) => setPatientContact(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-teal-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Row 3: Department Speciality */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulting Speciality Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="General Medicine">General Medicine (Cough, Fever, Flu)</option>
                  <option value="Pediatrics">Pediatrics (Child Care Speciality)</option>
                  <option value="Orthopedics">Orthopedics (Bone & Joint Clinic)</option>
                  <option value="Cardiology">Cardiology (Heart Care Desk)</option>
                </select>
              </div>

              {/* Row 4: Chief Complaints / Symptoms */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><HeartPulse size={12} /> Chief Symptoms / Complaints</label>
                <textarea 
                  rows="2"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe symptoms briefly (e.g., High fever since 2 days, severe headache)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-all shadow-inner resize-none"
                />
              </div>

              {/* Row 5: Priority Triage Switch & Submit */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPriority('normal')}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${priority === 'normal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Standard Routine
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${priority === 'high' ? 'bg-red-500 text-white shadow-sm shadow-red-200' : 'text-slate-400 hover:text-red-500'}`}
                  >
                    Emergency 🚨
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !patientName.trim()}
                  className="w-full sm:w-auto sm:ml-auto bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
                >
                  <UserPlus size={18} /> {isSubmitting ? 'Processing...' : 'Generate Token'}
                </button>
              </div>

            </form>
          </div>

          {/* MODULE 3: QUICK TOKEN GENERATOR (Kept for ultra-fast fallback without details) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => generateToken('normal')}
              className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:border-teal-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-36"
            >
              <div className="bg-teal-50 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center justify-between">
                  Quick Standard Token <span>+</span>
                </h3>
                <p className="text-slate-400 text-xs font-medium mt-1">1-Click automatic triage sorting.</p>
              </div>
            </button>

            <button 
              onClick={() => generateToken('emergency')}
              className="group bg-white p-6 rounded-2xl border border-red-100 shadow-sm hover:border-red-400 hover:shadow-md transition-all text-left flex flex-col justify-between h-36 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
              <div className="bg-red-50 w-12 h-12 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base text-red-600 flex items-center justify-between">
                  Quick Emergency Token <span>⚡</span>
                </h3>
                <p className="text-slate-400 text-xs font-medium mt-1">Immediate override. Pushes token to top.</p>
              </div>
            </button>
          </div>

          {/* MODULE 4: SYSTEM MAINTENANCE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">OPD Administrative Operations</h4>
              <p className="text-xs text-slate-400 font-medium">Clear session data, hard-refresh sockets, or sync database state manually.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchQueueStatus} 
                className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
                title="Force Refresh Data"
              >
                <RefreshCw size={18} />
              </button>
              <button 
                onClick={resetFullQueue}
                disabled={isResetting}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center gap-2 border border-red-100 transition-all"
              >
                <RotateCcw size={14} /> {isResetting ? 'Clearing...' : 'Reset Session'}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: QUEUE LIST */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[1050px] overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Active Matrix Queue</h2>
                <p className="text-xs text-slate-400 font-medium">Dynamic ranking pipeline active</p>
              </div>
              <span className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-md shadow-sm">
                {filteredQueue.length} Listed
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Token number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium transition-all"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-500">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-800'}`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('waiting')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${statusFilter === 'waiting' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-800'}`}
              >
                Waiting
              </button>
              <button 
                onClick={() => setStatusFilter('high')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${statusFilter === 'high' ? 'bg-white text-red-600 shadow-sm' : 'hover:text-red-500'}`}
              >
                Urgent
              </button>
              <button 
                onClick={() => setStatusFilter('skipped')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${statusFilter === 'skipped' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-800'}`}
              >
                On Hold
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/20 custom-scrollbar">
            {filteredQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle2 size={28} className="text-slate-300" />
                </div>
                <p className="font-semibold text-slate-600 text-sm">No match found</p>
                <p className="text-xs text-slate-400 mt-0.5">Adjust filters or register new walk-ins.</p>
              </div>
            ) : (
              filteredQueue.map((patient, index) => (
                <div 
                  key={patient._id} 
                  className={`p-4 rounded-xl border transition-all flex justify-between items-center group relative ${
                    patient.status === 'serving' ? 'hidden' : ''
                  } ${
                    patient.status === 'skipped'
                      ? 'bg-slate-50/50 border-slate-200 border-dashed opacity-70'
                      : patient.priority === 'high'
                      ? 'bg-red-50/60 border-red-100 shadow-sm'
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                      patient.status === 'skipped'
                        ? 'bg-slate-200 text-slate-500'
                        : patient.priority === 'high' 
                        ? 'bg-red-500 text-white shadow-md shadow-red-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {patient.tokenNumber}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-800 text-sm truncate">
                          {patient.name ? patient.name : (patient.status === 'skipped' ? 'Skipped/On-Hold' : patient.priority === 'high' ? 'Emergency Care' : 'Standard Routine')}
                        </p>
                        {patient.status === 'waiting' && index === 0 && (
                          <span className="bg-teal-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">Next</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        {patient.status === 'skipped' ? (
                          <span>Awaiting recall execution</span>
                        ) : (
                          <>
                            <Clock size={12} /> Approx. {avgWait * (index + 1)}m delay
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {patient.status === 'waiting' ? (
                      <button 
                        onClick={() => skipPatient(patient.tokenNumber)}
                        className="opacity-0 group-hover:opacity-100 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all"
                      >
                        Skip
                      </button>
                    ) : (
                      <button 
                        onClick={() => recallPatient(patient.tokenNumber)}
                        className="text-xs font-bold text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-600 px-2.5 py-1.5 rounded-lg border border-teal-100 transition-all shadow-sm"
                      >
                        Recall
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Reception;