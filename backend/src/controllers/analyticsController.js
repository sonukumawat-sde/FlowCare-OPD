const Queue = require('../models/Queue');

exports.getDashboardStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysTokens = await Queue.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ updatedAt: -1 });

    const totalPatients = todaysTokens.length;
    let patientsServed = 0;
    let totalWaitTime = 0;
    let emergencyCases = 0;
    let hourlyCount = new Array(24).fill(0); 

    todaysTokens.forEach(token => {
      if (token.priority === 'high') emergencyCases++;
      
      if (token.status === 'completed') {
        patientsServed++;
        totalWaitTime += (token.waitTime || 0);
      }

      const hour = new Date(token.createdAt).getHours();
      hourlyCount[hour]++;
    });

    const avgWaitTime = patientsServed > 0 ? Math.round(totalWaitTime / patientsServed) : 0;
    const standardCases = totalPatients - emergencyCases;

    const completionRate = totalPatients > 0 ? Math.round((patientsServed / totalPatients) * 100) : 0;
    const standardRate = totalPatients > 0 ? Math.round((standardCases / totalPatients) * 100) : 0;
    const emergencyRate = totalPatients > 0 ? Math.round((emergencyCases / totalPatients) * 100) : 0;

    const formatHour = (h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12} ${ampm}`;
    };

    const hourlyData = [];
    for (let i = 9; i <= 16; i++) {
      hourlyData.push({
        time: formatHour(i),
        patients: hourlyCount[i]
      });
    }

    // 🚀 FIXED: Yahan se .slice(0, 4) hata diya. Ab ye saare patients bhejega!
    const recentLogs = todaysTokens.map(p => {
      let action, details, type;
      
      const pName = p.patientName || p.name || 'Unknown Patient'; 

      if (p.status === 'completed') {
        action = 'Consultation Done';
        details = `Token ${p.tokenNumber} cleared`;
        type = 'success';
      } else if (p.status === 'skipped') {
        action = 'Patient Skipped';
        details = `Token ${p.tokenNumber} marked as no-show`;
        type = 'warning';
      } else {
        action = p.priority === 'high' ? 'Emergency Override' : 'Token Generated';
        details = p.priority === 'high' 
          ? `Token ${p.tokenNumber} pushed to priority` 
          : `Token ${p.tokenNumber} added to queue`;
        type = p.priority === 'high' ? 'alert' : 'normal';
      }

      let logTime;
      if (p.updatedAt) {
        logTime = new Date(p.updatedAt);
      } else if (p.createdAt) {
        logTime = new Date(p.createdAt);
      } else {
        logTime = new Date(); 
      }

      return {
        id: `#LOG-${p.tokenNumber}`,
        patientName: pName, 
        action,
        details,
        time: logTime.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}),
        type
      };
    });

    res.status(200).json({
      totalPatients,
      avgWaitTime,
      emergencyCases,
      completionRate,
      standardRate,
      emergencyRate,
      hourlyData,
      recentLogs
    });

  } catch (error) {
    console.error('[Analytics Controller Error]:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};