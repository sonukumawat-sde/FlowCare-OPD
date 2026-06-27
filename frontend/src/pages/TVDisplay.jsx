import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Bell, ArrowRight, Activity, Clock, MapPin, Stethoscope, Volume2, VolumeX, User } from 'lucide-react';

const TVDisplay = () => {
  const [queue, setQueue] = useState([]);
  const [currentToken, setCurrentToken] = useState(0);
  // 🚀 NAYA: Current patient ka naam store karne ke liye
  const [currentPatientName, setCurrentPatientName] = useState('');
  const [flash, setFlash] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchQueueStatus();
    const socket = io('http://localhost:5000');

    socket.on('queueUpdated', fetchQueueStatus);
    
    socket.on('callNext', (data) => {
      setCurrentToken(data.currentToken);
      // 🚀 NAYA: Socket se aane wale patient ka naam set karo
      setCurrentPatientName(data.patientName || data.name || '');
      fetchQueueStatus();
      
      setFlash(true);
      setTimeout(() => setFlash(false), 2000);
      
      if (soundEnabled && 'speechSynthesis' in window && data.currentToken > 0) {
        window.speechSynthesis.cancel(); 
        
        // Voice text me bhi naam add kar sakte hain aage chalkar agar zaroorat padi
        const announcementText = `Token number ${data.currentToken}, please proceed. टोकन नंबर ${data.currentToken}, कृपया डॉक्टर के पास जाएँ।`;
        const utterance = new SpeechSynthesisUtterance(announcementText);
        
        const voices = window.speechSynthesis.getVoices();
        const indianFemaleVoice = voices.find(voice => 
          voice.name.includes('Neerja') || 
          voice.name.includes('Swara') || 
          voice.name.includes('Google हिन्दी') ||
          voice.lang === 'hi-IN' || 
          voice.lang === 'en-IN'
        );

        if (indianFemaleVoice) {
          utterance.voice = indianFemaleVoice;
        }

        utterance.rate = 0.85; 
        utterance.pitch = 1.1; 
        utterance.volume = 1;
        
        window.speechSynthesis.speak(utterance);
      }
    });

    return () => socket.disconnect();
  }, [soundEnabled]);

  const fetchQueueStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/queue`);
      const waitingPatients = res.data?.queue?.filter(p => p.status === 'waiting') || [];
      setQueue(waitingPatients);
      setCurrentToken(res.data?.currentToken || 0);
      // 🚀 NAYA: API se current patient ka naam set karo
      if(res.data?.currentPatient) {
        setCurrentPatientName(res.data.currentPatient.patientName || res.data.currentPatient.name || '');
      }
    } catch (error) {
      console.error("Error fetching queue:", error);
    }
  };

  const getPatientDetails = (token) => {
    const doctors = ['Dr. A. Sharma', 'Dr. S. Verma', 'Dr. M. Patel'];
    const rooms = ['Room 101', 'Room 102', 'Room 103'];
    const index = token ? token % 3 : 0;
    return { doctor: doctors[index], room: rooms[index] };
  };

  const isSystemEmpty = queue.length === 0 && currentToken === 0;

  // 🚀 NAYA: Dummy queue me bhi patients ke naam add kiye taki UI test karte time accha lage
  const dummyQueue = [
    { _id: 'd1', tokenNumber: 102, priority: 'normal', patientName: 'Rahul Kumar' },
    { _id: 'd2', tokenNumber: 103, priority: 'high', patientName: 'Anjali Sharma' },
    { _id: 'd3', tokenNumber: 104, priority: 'normal', patientName: 'Vikram Singh' },
    { _id: 'd4', tokenNumber: 105, priority: 'normal', patientName: 'Priya Patel' },
  ];

  const displayToken = isSystemEmpty ? 101 : currentToken;
  const displayQueue = isSystemEmpty ? dummyQueue : queue.slice(0, 4);
  const currentDetails = getPatientDetails(displayToken);
  
  // 🚀 NAYA: Screen par dikhane ke liye naam
  const displayPatientName = isSystemEmpty ? "Demo Patient" : (currentPatientName || "Waiting for Patient...");

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans flex flex-col overflow-hidden selection:bg-transparent">
      
      <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl shadow-md shadow-teal-200">
            <Activity size={24} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-0.5">FlowCare</h1>
            <p className="text-slate-500 font-bold tracking-widest uppercase text-[9px]">Smart OPD Display</p>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-700 font-extrabold uppercase tracking-widest text-[10px]">Live System</span>
          </div>

          <div className="text-xl font-black text-slate-800 tabular-nums flex items-center gap-2">
            <Clock size={18} className="text-teal-600" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      <div className="flex-1 w-full flex p-5 gap-5 min-h-0 bg-slate-50">
        
        {/* LEFT PANEL */}
        <div className="flex-[1.2] flex flex-col h-full min-h-0">
          <div className={`flex-1 bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col p-6 transition-all duration-500 relative overflow-hidden ${flash ? 'ring-4 ring-teal-400 bg-teal-50/40' : ''}`}>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-teal-50 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full w-full items-center">
              
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full mb-auto transition-all duration-500 border-2 ${flash ? 'bg-teal-500 border-teal-400 text-white shadow-lg shadow-teal-200/50 scale-105' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <Bell size={20} className={flash ? 'animate-bounce' : ''} />
                <h2 className="text-base font-black uppercase tracking-widest">
                  Please Proceed
                </h2>
              </div>

              {/* TOKEN NUMBER & PATIENT NAME */}
              <div className="flex flex-col items-center justify-center my-auto w-full">
                <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-2">Token Number</p>
                <div className="text-[10rem] md:text-[11rem] leading-[0.8] font-black text-cyan-950 tabular-nums tracking-tighter drop-shadow-sm">
                  {displayToken > 0 ? displayToken : '--'}
                </div>
                
                {/* 🚀 NAYA: Big Screen Par Patient Ka Naam */}
                {displayToken > 0 && (
                  <div className="mt-8 bg-white border border-slate-200 shadow-sm px-8 py-3 rounded-2xl flex items-center gap-3">
                    <User className="text-teal-500" size={24} />
                    <p className="text-2xl font-black text-slate-800 tracking-wide">
                      {displayPatientName}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mt-auto">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="bg-cyan-100 text-cyan-700 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    <Stethoscope size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Consulting</p>
                    <p className="text-base font-black text-slate-800 truncate">{currentDetails.doctor}</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="bg-teal-100 text-teal-700 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Direction</p>
                    <p className="text-base font-black text-slate-800 truncate">{currentDetails.room}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT PANEL: UP NEXT QUEUE */}
        <div className="flex-1 flex flex-col h-full min-h-0">
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                Up Next <ArrowRight className="text-teal-500" size={20} />
              </h2>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">Queue</span>
            </div>

            <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
              {displayQueue.map((patient) => {
                const details = getPatientDetails(patient.tokenNumber);
                // 🚀 NAYA: Queue ke andar patient ka naam nikal rahe hain
                const listPatientName = patient.patientName || patient.name || 'Unknown Patient';

                return (
                  <div 
                    key={patient._id} 
                    className={`flex-1 flex items-center px-4 py-2 rounded-2xl border transition-all min-h-0 ${
                      patient.priority === 'high' 
                        ? 'bg-red-50/40 border-red-200 shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-teal-50/30'
                    }`}
                  >
                    
                    <div className={`w-20 h-full max-h-[4.5rem] rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                      patient.priority === 'high' ? 'bg-red-500 border-red-600 text-white shadow-sm' : 'bg-slate-100 border-slate-200 text-cyan-950'
                    }`}>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Token</span>
                      <span className="text-2xl font-black leading-none tabular-nums">{patient?.tokenNumber}</span>
                    </div>
                    
                    {/* 🚀 NAYA: UI for Patient Name in the List */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center px-4">
                      <p className={`text-base font-black truncate mb-0.5 ${patient.priority === 'high' ? 'text-red-700' : 'text-slate-800'}`}>
                        {listPatientName}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${patient.priority === 'high' ? 'text-red-500' : 'text-slate-500'}`}>
                          {patient.priority === 'high' ? 'Emergency' : 'Standard'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500 truncate">
                          <Stethoscope size={12} className="shrink-0" />
                          <span className="truncate">{details.doctor}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-24 shrink-0 flex flex-col items-center justify-center h-full border-l border-slate-100/50 pl-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prep Area</p>
                      <div className={`w-full text-center py-1.5 rounded-lg font-bold text-xs border ${patient.priority === 'high' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                        {details.room}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
            
          </div>
        </div>

      </div>

      <footer className="h-10 bg-cyan-950 text-cyan-100 shrink-0 flex items-center overflow-hidden">
        <marquee scrollamount="5" className="text-xs font-bold tracking-[0.2em] uppercase pt-0.5 w-full">
          <span className="mx-6 text-teal-400">✦</span> Welcome To FlowCare Smart OPD 
          <span className="mx-6 text-teal-400">✦</span> Please Keep Your Documents Ready For The Doctor
          <span className="mx-6 text-teal-400">✦</span> Emergency Cases Are Given Immediate Priority
          <span className="mx-6 text-teal-400">✦</span> Maintain Silence In The Waiting Area
        </marquee>
      </footer>

    </div>
  );
};

export default TVDisplay;