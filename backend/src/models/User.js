const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false 
  },
  role: {
    type: String,
    enum: ['receptionist', 'admin', 'doctor'],
    default: 'receptionist'
  }
}, {
  timestamps: true
});

// 🔒 FIXED: Naye Mongoose mein async ke sath 'next' ki zaroorat nahi hoti
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return; // Yahan se next() hata diya
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Yahan se bhi next() hata diya
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);