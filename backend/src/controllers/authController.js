const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 🔐 Helper Function: JWT Token Generate Karne Ke Liye
const generateToken = (id) => {
  // process.env.JWT_SECRET env file se aayega, warna fallback key use karega
  return jwt.sign({ id }, process.env.JWT_SECRET || 'flowcare_super_secret_hackathon_key', {
    expiresIn: '30d', // 30 din tak login rahega
  });
};

// ==========================================
// 1. REGISTER API (Naya account banane ke liye)
// ==========================================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check karo ki user pehle se toh nahi hai
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Naya User create karo
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("[Register Error]:", error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// ==========================================
// 2. LOGIN API (Email aur Password check karne ke liye)
// ==========================================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email se user dhoondo (select('+password') isliye kyuki humne schema me password hide kiya tha)
    const user = await User.findOne({ email }).select('+password');

    // Agar user nahi mila YA password match nahi hua
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Agar sab sahi hai toh Token bhej do
    res.status(200).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error("[Login Error]:", error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};