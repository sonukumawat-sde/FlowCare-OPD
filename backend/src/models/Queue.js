const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  // ---- 1. CORE SYSTEM FIELDS ----
  tokenNumber: { 
    type: Number, 
    required: true 
  },
  
  // ---- 2. NEW ADVANCED PATIENT FIELDS ----
  name: { 
    type: String, 
    default: 'Walk-in Patient' // Agar quick button dabaya toh default naam ye aayega
  },
  age: { 
    type: Number 
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'] 
  },
  contact: { 
    type: String 
  },
  department: { 
    type: String, 
    default: 'General Medicine' 
  },
  symptoms: { 
    type: String 
  },

  // ---- 3. QUEUE MANAGEMENT FIELDS ----
  status: { 
    type: String, 
    enum: ['waiting', 'serving', 'completed', 'skipped'], 
    default: 'waiting' 
  },
  priority: { 
    type: String, 
    enum: ['normal', 'high'], 
    default: 'normal' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  calledAt: { 
    type: Date 
  },
  completedAt: { 
    type: Date 
  },
  waitTime: { 
    type: Number // Stored in minutes for accurate analytics tracking
  }
});

module.exports = mongoose.model('Queue', queueSchema);