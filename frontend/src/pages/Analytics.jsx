import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Clock, Flame, CheckCircle2, TrendingUp, 
  TrendingDown, Calendar, Download, Activity, ShieldAlert, ChevronRight, ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Analytics = () => {
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 0,
    avgWaitTime: 0,
    emergencyCases: 0,
    completionRate: 0,
    standardRate: 0,
    emergencyRate: 0,
    hourlyData: [],
    recentLogs: []
  });

  // 🚀 NAYA: "View All" ke liye state
  const [showAllLogs, setShowAllLogs] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_URL}/analytics`);
        if(res.data) {
          setDashboardData(res.data);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3000); 
    return () => clearInterval(interval);
  }, []);

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      doc.setFillColor(13, 148, 136); 
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("FlowCare Smart OPD", 15, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Daily Operational Report", 15, 28);
      
      doc.setFontSize(10);
      doc.text(`Date: ${dateStr}`, 140, 28);

      doc.setTextColor(51, 65, 85); 
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary Overview", 15, 55);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Patients: ${dashboardData?.totalPatients || 0}`, 15, 65);
      doc.text(`Avg Wait Time: ${dashboardData?.avgWaitTime || 0}m`, 75, 65);
      doc.text(`Emergency Cases: ${dashboardData?.emergencyCases || 0}`, 135, 65);
      doc.text(`Completion Rate: ${dashboardData?.completionRate || 0}%`, 15, 75);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Patient Log", 15, 95);

      const tableColumn = ["Log ID", "Patient Name", "Action Type", "Details", "Timestamp"];
      const tableRows = [];

      const logsToExport = dashboardData?.recentLogs || [];
      
      if (logsToExport.length === 0) {
        tableRows.push(["-", "-", "No Data Yet", "System is waiting for patients", "-"]);
      } else {
        logsToExport.forEach(log => {
          tableRows.push([log.id, log.patientName, log.action, log.details, log.time]);
        });
      }

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 100,
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136], textColor: 255, fontSize: 10 },
        bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`FlowCare_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Export Error: ", err);
      alert("Error generating PDF! Please check the console.");
    }
  };

  const stats = [
    // 🚀 FIXED: Total Patients ab proper bind hai
    { title: "Total Patients", value: dashboardData?.totalPatients || 0, change: "Live", isUp: true, icon: Users, color: "cyan" },
    { title: "Avg. Wait Time", value: `${dashboardData?.avgWaitTime || 0}m`, change: "Auto", isUp: true, icon: Clock, color: "emerald" }, 
    { title: "Emergency Cases", value: dashboardData?.emergencyCases || 0, change: "Urgent", isUp: false, icon: Flame, color: "red" },
    { title: "Completion Rate", value: `${dashboardData?.completionRate || 0}%`, change: "Live", isUp: true, icon: CheckCircle2, color: "teal" },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl">
          {`${payload[0].value} Patients`}
        </div>
      );
    }
    return null;
  };

  // 🚀 NAYA: Logs ko slice karne ka logic
  const displayedLogs = showAllLogs 
    ? (dashboardData?.recentLogs || []) 
    : (dashboardData?.recentLogs || []).slice(0, 4);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12 -mt-2 animate-in fade-in duration-700 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-teal-100/50 to-transparent blur-[100px] -z-10 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Hospital Metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm text-sm font-bold text-slate-600">
            <Calendar size={18} className="text-teal-600" />
            <span>Today's Data</span>
          </div>
          <button 
            onClick={exportToPDF}
            className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-[0_8px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_8px_25px_rgba(20,184,166,0.3)] transition-all hover:-translate-y-0.5"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/90 backdrop-blur-lg p-6 rounded-[2rem] border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50/80 text-${stat.color}-600 flex items-center justify-center shrink-0 border border-${stat.color}-100`}>
                <stat.icon size={26} strokeWidth={2.5} />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter mb-2">{stat.value}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2 bg-white/90 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Patient Traffic Density</h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">Live hourly inflow across all departments</p>
            </div>
            <div className="p-3 bg-cyan-50/50 rounded-2xl text-cyan-600 border border-cyan-100">
              <Activity size={24} />
            </div>
          </div>

          <div className="flex-1 w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData?.hourlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<CustomTooltip />} />
                <Bar dataKey="patients" fill="url(#colorPatients)" radius={[8, 8, 8, 8]}>
                  {(dashboardData?.hourlyData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} className="hover:opacity-80 transition-opacity duration-300" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-slate-800">Triage Distribution</h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">Live Standard vs Emergency priority</p>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-10">
            <div>
              <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">Standard</p>
                    <p className="text-xs font-medium text-slate-400">Routine Checkups</p>
                  </div>
                </div>
                <span className="text-slate-800 text-3xl font-black tracking-tighter">{dashboardData?.standardRate || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-teal-400 h-full rounded-full transition-all duration-1000" style={{ width: `${dashboardData?.standardRate || 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">Emergency</p>
                    <p className="text-xs font-medium text-slate-400">Critical Care</p>
                  </div>
                </div>
                <span className="text-slate-800 text-3xl font-black tracking-tighter">{dashboardData?.emergencyRate || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-1000" style={{ width: `${dashboardData?.emergencyRate || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white/90 backdrop-blur-lg rounded-[2.5rem] border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800">System Activity Logs</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Live Database Audit Trail</p>
          </div>
          
          {/* 🚀 NAYA: Working View All Button */}
          {dashboardData?.recentLogs?.length > 4 && (
            <button 
              onClick={() => setShowAllLogs(!showAllLogs)}
              className="text-sm font-bold text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-600 px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 group"
            >
              {showAllLogs ? 'Show Less' : 'View All'} 
              {showAllLogs 
                ? <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" /> 
                : <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              }
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto p-4 transition-all duration-500">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b-2 border-slate-100">
                <th className="px-6 py-4">Log ID</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Event Details</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {/* 🚀 NAYA: Sirf utne hi logs dikhayega jitna state me allow hai */}
              {displayedLogs.map((log, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 font-black text-slate-400 group-hover:text-cyan-600 transition-colors">{log.id}</td>
                  <td className="px-6 py-5 font-bold text-slate-700">{log.patientName}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border ${
                      log.type === 'alert' ? 'bg-red-50 text-red-600 border-red-100' :
                      log.type === 'warning' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      log.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-cyan-50 text-cyan-600 border-cyan-100'
                    }`}>
                      {log.type === 'alert' && <ShieldAlert size={14} />}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600">{log.details}</td>
                  <td className="px-6 py-5 font-bold text-slate-400 text-right">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayedLogs.length === 0 && (
            <div className="text-center py-8 text-slate-400 font-bold">No active logs for today. Add a new patient to see live updates.</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Analytics;