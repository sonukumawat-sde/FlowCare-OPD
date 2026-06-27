const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  hospitalName: { 
    type: String, 
    default: 'FlowCare Hospital' 
  },
  currentToken: { 
    type: Number, 
    default: 0 
  },
  avgConsultationTime: { 
    type: Number, 
    default: 11 // PRD ke hisaab se default 11 mins
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
