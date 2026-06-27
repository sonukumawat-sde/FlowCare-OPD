const Queue = require('../models/Queue');
const Settings = require('../models/Settings');

const updateDynamicAverage = async () => {
  try {
    // Aakhiri 10 patients jinka checkup complete ho chuka hai, unka data laao
    const recentPatients = await Queue.find({
      status: 'completed',
      calledAt: { $exists: true },
      completedAt: { $exists: true }
    })
    .sort({ completedAt: -1 }) // Sabse recent wale pehle
    .limit(10);

    if (recentPatients.length === 0) return; // Agar koi history nahi hai, to default time hi chalne do

    let totalConsultationTime = 0;
    let validRecords = 0;

    recentPatients.forEach(patient => {
      // Doctor ke paas andar kitna time laga (completed time - called time)
      const timeDiffMs = patient.completedAt - patient.calledAt;
      const timeDiffMins = Math.round(timeDiffMs / 60000); // milliseconds ko minutes me convert kiya
      
      // Edge Case: Agar kisi ne galti se 5 second me complete daba diya ya 3 ghante tak band nahi kiya, to us anomaly ko ignore karo
      if (timeDiffMins >= 1 && timeDiffMins < 120) {
        totalConsultationTime += timeDiffMins;
        validRecords++;
      }
    });

    // Naya Average calculate karo
    if (validRecords > 0) {
      const newAverage = Math.round(totalConsultationTime / validRecords);
      const finalAverage = Math.max(1, newAverage); // Kam se kam 1 minute to hoga hi

      // Naya average Settings me save kar do
      const settings = await Settings.findOne();
      if (settings && settings.avgConsultationTime !== finalAverage) {
        settings.avgConsultationTime = finalAverage;
        settings.lastUpdated = Date.now();
        await settings.save();
        console.log(`[Smart Engine] New Average Consultation Time calculated: ${finalAverage} mins`);
      }
      
      return finalAverage;
    }
  } catch (error) {
    console.error('[Smart Engine Error]: Failed to calculate dynamic wait time', error);
  }
};

module.exports = { updateDynamicAverage };