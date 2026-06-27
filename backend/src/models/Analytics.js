const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true, 
    unique: true // Format: YYYY-MM-DD, ensures only one aggregated record per day
  },
  totalPatients: { 
    type: Number, 
    default: 0 // NAYA: Aaj ke total tokens kitne kate hain
  },
  patientsServed: { 
    type: Number, 
    default: 0 // Kitne patients ka checkup complete ho gaya
  },
  standardCases: {
    type: Number,
    default: 0 // NAYA: Normal (Routine) priority wale cases
  },
  emergencyCases: { 
    type: Number, 
    default: 0 // High priority wale cases
  },
  avgWait: { 
    type: Number, 
    default: 0 // Overall average waiting time in minutes for the day
  },
  skippedTokens: { 
    type: Number, 
    default: 0 // Jo patients skip ho gaye ya nahi aaye
  },
  peakHour: { 
    type: String, // e.g., "10:00 AM - 11:00 AM"
    default: "N/A"
  },
  // Production optimization for the "Patients per hour" graph
  hourlyStats: [{
    hour: { type: String }, // e.g., "10", "14" (24-hour format string)
    count: { type: Number, default: 0 }
  }]
}, {
  timestamps: true // NAYA: Ye record kab bana aur kab update hua, wo bhi track karega
});

module.exports = mongoose.model('Analytics', analyticsSchema);