const Queue = require('../models/Queue');
const Settings = require('../models/Settings');
const Analytics = require('../models/Analytics');
const { updateDynamicAverage } = require('../services/waitTimeEngine'); 

// Helper function: Ensure settings exist
const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

// 1. Get Current Queue Status
exports.getQueueStatus = async (req, res) => {
  try {
    const settings = await getSettings();
    const queue = await Queue.find({ status: { $in: ['waiting', 'serving'] } })
                             .sort({ priority: -1, createdAt: 1 });
    
    res.status(200).json({
      success: true,
      currentToken: settings.currentToken,
      avgConsultationTime: settings.avgConsultationTime,
      queue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// 2. Generate Normal Token (Quick Button)
exports.generateToken = async (req, res) => {
  try {
    const lastToken = await Queue.findOne().sort({ tokenNumber: -1 });
    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const newToken = await Queue.create({
      tokenNumber: nextTokenNumber,
      status: 'waiting',
      priority: 'normal'
    });

    const io = req.app.get('io');
    if (io) io.emit('queueUpdated');
    if (io) io.emit('tokenGenerated', newToken);

    res.status(201).json({ success: true, token: newToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating token' });
  }
};

// 3. Generate Emergency Token (Quick Button)
exports.generateEmergencyToken = async (req, res) => {
  try {
    const lastToken = await Queue.findOne().sort({ tokenNumber: -1 });
    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const emergencyToken = await Queue.create({
      tokenNumber: nextTokenNumber,
      status: 'waiting',
      priority: 'high'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated');
      io.emit('emergencyAdded', emergencyToken);
    }

    res.status(201).json({ success: true, token: emergencyToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating emergency token' });
  }
};

// 4. Call Next Patient
exports.callNext = async (req, res) => {
  try {
    const settings = await getSettings();

    // A. Complete currently serving patient
    const currentlyServing = await Queue.findOne({ status: 'serving' });
    if (currentlyServing) {
      currentlyServing.status = 'completed';
      currentlyServing.completedAt = Date.now();
      const waitMs = currentlyServing.calledAt - currentlyServing.createdAt;
      currentlyServing.waitTime = Math.round(waitMs / 60000);
      await currentlyServing.save();

      // Engine Trigger - Naya average calculate karo
      await updateDynamicAverage();
    }

    // Settings wapas fetch karo
    const updatedSettings = await Settings.findOne();

    // B. Find next waiting patient
    const nextPatient = await Queue.findOne({ status: 'waiting' }).sort({ priority: -1, createdAt: 1 });
    
    if (!nextPatient) {
      return res.status(200).json({ success: true, message: 'No more patients waiting', currentToken: 0 });
    }

    // C. Update next patient to serving
    nextPatient.status = 'serving';
    nextPatient.calledAt = Date.now();
    await nextPatient.save();

    // D. Update Settings
    updatedSettings.currentToken = nextPatient.tokenNumber;
    await updatedSettings.save();

    // E. Socket Broadcasts
    const io = req.app.get('io');
    if (io) {
      io.emit('callNext', { currentToken: nextPatient.tokenNumber });
      io.emit('announcementTriggered', nextPatient.tokenNumber);
      io.emit('queueUpdated');
      io.emit('settingsUpdated', { avgConsultationTime: updatedSettings.avgConsultationTime });
    }

    res.status(200).json({ success: true, currentToken: nextPatient.tokenNumber, patient: nextPatient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error calling next patient' });
  }
};

// 5. Skip Token
exports.skipToken = async (req, res) => {
  try {
    const { tokenNumber } = req.body;
    const token = await Queue.findOne({ tokenNumber, status: 'waiting' });
    
    if (!token) return res.status(404).json({ success: false, message: 'Token not found or not waiting' });

    token.status = 'skipped';
    await token.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated');
      io.emit('tokenSkipped', tokenNumber);
    }

    res.status(200).json({ success: true, message: `Token ${tokenNumber} skipped` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error skipping token' });
  }
};

// 6. Recall Skipped Token
exports.recallToken = async (req, res) => {
  try {
    const { tokenNumber } = req.body;
    const token = await Queue.findOne({ tokenNumber, status: 'skipped' });
    
    if (!token) return res.status(404).json({ success: false, message: 'Skipped token not found' });

    token.status = 'waiting';
    token.priority = 'high'; 
    await token.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated');
      io.emit('tokenRecalled', tokenNumber);
    }

    res.status(200).json({ success: true, message: `Token ${tokenNumber} recalled to queue` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recalling token' });
  }
};

// 7. NAYA: Generate Advanced Token (From Registration Desk)
exports.addAdvancedToken = async (req, res) => {
  try {
    // Frontend se bheje gaye saare details req.body me aate hain
    const { name, priority, department, age, gender, contact, symptoms } = req.body;

    const lastToken = await Queue.findOne().sort({ tokenNumber: -1 });
    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    // Database Model (Blueprint) me details save karo
    const newToken = await Queue.create({
      tokenNumber: nextTokenNumber,
      name: name,
      age: age,
      gender: gender,
      contact: contact,
      department: department,
      symptoms: symptoms,
      priority: priority || 'normal',
      status: 'waiting'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated');
      io.emit('tokenGenerated', newToken);
    }

    res.status(201).json({ success: true, token: newToken });
  } catch (error) {
    console.error("Advanced Registration Error:", error);
    res.status(500).json({ success: false, message: 'Error generating advanced token' });
  }
};