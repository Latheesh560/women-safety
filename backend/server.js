const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');
const twilio = require('twilio');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Resolve JWT secret securely without hardcoded literal fallback
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️  JWT_SECRET is not set in environment — using generated ephemeral secret for this instance.');
  return crypto.randomBytes(32).toString('hex');
})();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads', 'incidents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm'
]);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeBase = path.basename(file.originalname || '');
    const ext = path.extname(safeBase).toLowerCase();
    const validExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${validExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max
  },
  fileFilter: function (req, file, cb) {
    const safeBase = path.basename(file.originalname || '');
    const ext = path.extname(safeBase).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG, WEBP, MP4, and WEBM files up to 10MB are allowed.'));
    }
    // TODO(security): Integrate malware scanning / CDR in production uploads pipeline
    cb(null, true);
  }
});

// XML Escape helper for TwiML
const escapeXml = (unsafe = '') =>
  String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Incident = require('./models/Incident');
const Guardian = require('./models/Guardian');
const Settings = require('./models/Settings');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5005;
const HOST = process.env.HOST || '127.0.0.1';

// Allowed Origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|.*\.ngrok-free\.app|.*\.ngrok\.io|.*\.localtunnel\.me|.*\.loca\.lt|.*\.pinggy(-free)?\.link|.*\.vercel\.app)(:\d+)?$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
};

// Socket.IO Setup
const io = new Server(server, {
  cors: corsOptions
});

// Security Headers & Request Logging Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  console.log(`🛡️ [REQ] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'none'}`);
  next();
});
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  })
);

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  message: { success: false, message: 'Too many requests, please slow down.' }
});
app.use('/api', apiLimiter);

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/women-safety';
mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// ==========================================
// TWILIO SETUP (SMS & Voice Notifications)
// ==========================================
const getTwilioClient = () => {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid'
  ) {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return null;
};

const sendSOSSMS = async (toPhone, toName, userName, lat, lon) => {
  const client = getTwilioClient();
  if (!client) {
    console.log('⚠️  Twilio not configured - skipping SMS for', toName);
    return { success: false, error: 'Twilio not configured' };
  }

  let formattedPhone = toPhone.toString().trim();
  if (formattedPhone.length === 10 && /^\d+$/.test(formattedPhone)) {
    formattedPhone = `+91${formattedPhone}`;
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }

  const mapsLink = `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`;
  const messageBody = `🚨 EMERGENCY SOS ALERT 🚨\n${userName} has triggered an SOS and needs immediate help.\n\nDear ${toName},\nPlease check on them. Live Location:\n${mapsLink}`;

  const safeUserName = escapeXml(userName);
  const safeToName = escapeXml(toName);

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    console.log(`📱 SOS SMS sent to ${formattedPhone}: ${message.sid}`);

    const call = await client.calls.create({
      twiml: `<Response><Say voice='alice'>Emergency SOS Alert. ${safeUserName} has triggered an S O S and needs immediate help. Dear ${safeToName}, please check on them immediately. Their live location is available on the app.</Say></Response>`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    console.log(`📞 SOS Call sent to ${formattedPhone}: ${call.sid}`);

    return { success: true, messageId: message.sid, callId: call.sid };
  } catch (error) {
    console.error(`❌ Failed to send SOS Alert to ${toPhone}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized - Invalid or expired token' });
  }
};

// ==========================================
// ROUTES
// ==========================================
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SheShield Women Safety API is running 🛡️' });
});

// ---------- AUTH ROUTES ----------
// TODO(security): Consider adding OAuth2/MFA and leaked password detection for enhanced account protection.

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const phone = (req.body.phone || '').trim();

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'All fields (name, email, phone, password) are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, phone });
    await user.save();

    await Settings.create({ userId: user._id });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to sign in. Please try again.' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error('Fetch user error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load user profile.' });
  }
});

app.post('/api/user/profile', authMiddleware, async (req, res) => {
  const name = (req.body.name || '').trim();
  const phone = (req.body.phone || '').trim();

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { name, phone } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// ---------- SOS ROUTES ----------

app.post('/api/sos/activate', authMiddleware, async (req, res) => {
  const { lat, lon } = req.body;
  console.log(`🚨 SOS Activated by user ${req.userId} at Lat: ${lat}, Lon: ${lon}`);

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const guardians = await Guardian.find({ userId: req.userId });
    const twilioConfigured =
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid';

    if (twilioConfigured && guardians.length > 0) {
      guardians.forEach((guardian) => {
        if (guardian.phone) {
          sendSOSSMS(guardian.phone, guardian.name, user.name, lat, lon).catch((error) =>
            console.error(`❌ Background SOS SMS to ${guardian.phone} failed:`, error.message)
          );
        }
      });

      return res.json({
        success: true,
        status: 'ACTIVATED',
        timestamp: new Date().toISOString(),
        message: `Emergency SOS activated! Dispatching SMS & voice alerts to ${guardians.length} guardian(s) in background.`
      });
    }

    let message = 'SOS signal activated.';
    if (!twilioConfigured) {
      message += ' SMS alerts not configured — please set up Twilio in backend .env file.';
    }
    if (guardians.length === 0) {
      message += ' No guardians configured — please add emergency contacts in Settings.';
    }

    res.json({
      success: true,
      status: 'ACTIVATED',
      timestamp: new Date().toISOString(),
      message
    });
  } catch (err) {
    console.error('SOS Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to process SOS alert.' });
  }
});

app.post('/api/sos/deactivate', authMiddleware, (req, res) => {
  console.log(`✅ SOS Deactivated by user ${req.userId}`);
  res.json({ success: true, status: 'DEACTIVATED', timestamp: new Date().toISOString() });
});

app.post('/api/sos/fake-call', authMiddleware, (req, res) => {
  res.json({ success: true, delaySeconds: 30, incomingCaller: 'Mom' });
});

// ---------- INCIDENT ROUTES ----------

app.post('/api/incidents/report', authMiddleware, (req, res) => {
  upload.single('media')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ success: false, message: uploadErr.message || 'File upload error' });
    }

    try {
      const title = (req.body.title || '').trim();
      const description = (req.body.description || '').trim();
      const location = (req.body.location || '').trim();
      const allowedTypes = ['Harassment', 'Assault', 'Theft', 'Suspicious', 'Other'];
      const allowedSeverities = ['Low', 'Medium', 'High', 'Critical'];
      const type = allowedTypes.includes(req.body.type) ? req.body.type : 'Other';
      const severity = allowedSeverities.includes(req.body.severity) ? req.body.severity : 'Medium';
      const lat = req.body.lat ? String(req.body.lat).trim() : '';
      const lon = req.body.lon ? String(req.body.lon).trim() : '';

      if (!title || !description || !location) {
        return res.status(400).json({ success: false, message: 'Title, description, and location are required.' });
      }

      let mediaUrl = '';
      if (req.file) {
        mediaUrl = `/uploads/incidents/${path.basename(req.file.filename)}`;
      }

      const newIncident = new Incident({
        userId: req.userId,
        title,
        description,
        location,
        type,
        severity,
        lat,
        lon,
        mediaUrl
      });
      await newIncident.save();

      io.emit('new_incident', newIncident);

      const authorityPhone = process.env.AUTHORITY_PHONE_NUMBER;
      const client = getTwilioClient();
      if (client && authorityPhone && authorityPhone !== 'your_authority_phone_number') {
        const serverUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
        const fullMediaUrl = mediaUrl ? `${serverUrl}${mediaUrl}` : 'No media attached';
        const messageBody = `🚨 INCIDENT REPORT: ${newIncident.title} 🚨\nType: ${newIncident.type}\nSeverity: ${newIncident.severity}\nLocation: ${newIncident.location}\nDesc: ${newIncident.description}\nMedia: ${fullMediaUrl}`;

        client.messages
          .create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: authorityPhone
          })
          .catch((err) => console.error('Failed to send authority SMS:', err.message));
      }

      res.json({ success: true, report: newIncident });
    } catch (err) {
      console.error('Report incident error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to submit incident report.' });
    }
  });
});

app.get('/api/incidents/my-reports', authMiddleware, async (req, res) => {
  try {
    const incidents = await Incident.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    console.error('My reports error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
});

app.get('/api/incidents/all', authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const incidents = await Incident.find({
      createdAt: { $gte: thirtyDaysAgo },
      lat: { $ne: '' },
      lon: { $ne: '' }
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(incidents);
  } catch (err) {
    console.error('All incidents error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch incidents.' });
  }
});

// ---------- COMMUNITY ROUTES ----------

app.get('/api/community/messages', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 }).limit(100);
    res.json(posts.reverse());
  } catch (err) {
    console.error('Get community messages error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load community messages.' });
  }
});

app.post('/api/community/message', authMiddleware, async (req, res) => {
  const content = (req.body.content || '').trim();
  const replyTo = req.body.replyTo || null;

  if (!content) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
  }

  try {
    const user = await User.findById(req.userId);
    const sanitizedReply =
      replyTo && typeof replyTo === 'object'
        ? {
            _id: replyTo._id || null,
            username: String(replyTo.username || '').slice(0, 100),
            content: String(replyTo.content || '').slice(0, 500)
          }
        : null;

    const newPost = new Post({
      username: user ? user.name : 'Anonymous',
      content: content.slice(0, 2000),
      replyTo: sanitizedReply
    });
    await newPost.save();

    io.emit('new_message', newPost);

    res.json(newPost);
  } catch (err) {
    console.error('Post community message error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to post message.' });
  }
});

// ---------- GUARDIAN ROUTES ----------

app.get('/api/guardians', authMiddleware, async (req, res) => {
  try {
    const guardians = await Guardian.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json({ success: true, guardians });
  } catch (err) {
    console.error('Get guardians error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch guardians.' });
  }
});

app.post('/api/guardians', authMiddleware, async (req, res) => {
  try {
    const guardians = Array.isArray(req.body.guardians) ? req.body.guardians : [];

    await Guardian.deleteMany({ userId: req.userId });

    const guardianDocs = guardians
      .filter((g) => g && String(g.name || '').trim() && String(g.phone || '').trim())
      .map((g) => ({
        userId: req.userId,
        name: String(g.name).trim(),
        relation: String(g.relation || 'Guardian').trim(),
        phone: String(g.phone).trim(),
        email: String(g.email || '').trim()
      }));

    const saved = guardianDocs.length > 0 ? await Guardian.insertMany(guardianDocs) : [];
    res.json({ success: true, guardians: saved });
  } catch (err) {
    console.error('Save guardians error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save guardians.' });
  }
});

// ---------- USER SETTINGS ROUTES ----------

app.get('/api/user/settings', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.userId });
    if (!settings) {
      settings = await Settings.create({ userId: req.userId });
    }
    res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load settings.' });
  }
});

app.post('/api/user/settings', authMiddleware, async (req, res) => {
  try {
    const updateFields = {
      notificationsEnabled: Boolean(req.body.notificationsEnabled),
      locationSharing: Boolean(req.body.locationSharing),
      updatedAt: Date.now()
    };

    const settings = await Settings.findOneAndUpdate(
      { userId: req.userId },
      { $set: updateFields },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    console.error('Update settings error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save settings.' });
  }
});

// ---------- AI BOT ROUTES ----------

app.post('/api/bot/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured in backend.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        "You are the 'SheShield Safety Assistant', a supportive, empathetic, and knowledgeable AI companion integrated into a women's safety app. Your main goal is to provide safety advice, emergency preparedness tips, emotional support, and general guidance. Keep responses concise, helpful, and reassuring. Do not hallucinate emergency services phone numbers; instead, tell them to use the SOS button or call local authorities."
    });

    const formattedHistory = Array.isArray(history)
      ? history.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(msg.text || '') }]
        }))
      : [];

    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(String(message || ''));
    const responseText = result.response.text();

    res.json({ success: true, response: responseText });
  } catch (err) {
    console.error('Bot Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to communicate with AI Bot.' });
  }
});

// ---------- ROUTES OPTIMIZE ----------

app.post('/api/routes/optimize', authMiddleware, (req, res) => {
  const { source, destination } = req.body;
  res.json({
    source,
    destination,
    message: 'Route optimization is handled client-side via OpenRouteService API.'
  });
});

// ==========================================
// SOCKET.IO - Real-time Community Chat
// ==========================================
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// ==========================================
// START SERVER
// ==========================================
server.listen(PORT, HOST, () => {
  console.log(`🛡️  SheShield Backend running on http://${HOST}:${PORT}`);
  console.log('📡 Socket.IO ready for real-time connections');

  const twilioConfigured =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid';
  if (twilioConfigured) {
    console.log(`📱 Twilio configured - SOS SMS will be sent from ${process.env.TWILIO_PHONE_NUMBER}`);
  } else {
    console.log('⚠️  Twilio not configured - SOS SMS disabled. Update .env to enable.');
  }
});
