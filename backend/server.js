const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Incident = require('./models/Incident');
const Guardian = require('./models/Guardian');
const Settings = require('./models/Settings');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Allowed Origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
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

// Middleware
app.use((req, res, next) => {
  console.log(`🛡️ [REQ] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'none'}`);
  next();
});
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' }
});

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/women-safety';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// ==========================================
// NODEMAILER SETUP (Replaces Twilio)
// ==========================================
const createMailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendSOSEmail = async (toEmail, toName, userName, lat, lon) => {
  const transporter = createMailTransporter();
  const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'SheShield SOS'}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `🚨 EMERGENCY SOS ALERT from ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF4777, #FF8DA1); padding: 20px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY SOS ALERT</h1>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">SheShield Women Safety System</p>
        </div>
        
        <div style="background: #FFF5F6; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #FFE0E6;">
          <p style="font-size: 16px; color: #333; margin: 0 0 12px;">
            <strong>${userName}</strong> has triggered an <strong style="color: #FF4777;">Emergency SOS Alert</strong> and needs immediate help.
          </p>
          
          <p style="font-size: 14px; color: #555; margin: 0 0 8px;">
            <strong>Dear ${toName},</strong>
          </p>
          <p style="font-size: 14px; color: #555; margin: 0 0 16px;">
            Please check on them immediately. Their live GPS coordinates are below.
          </p>
          
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #666;">
              📍 <strong>Latitude:</strong> ${lat}
            </p>
            <p style="margin: 0 0 12px; font-size: 13px; color: #666;">
              📍 <strong>Longitude:</strong> ${lon}
            </p>
            <a href="${mapsLink}" style="display: inline-block; background: #FF4777; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              📍 Open Location in Google Maps
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 16px; padding: 12px; background: #F8FAFC; border-radius: 8px;">
          <p style="font-size: 11px; color: #999; margin: 0;">
            This alert was sent via SheShield Women Safety App at ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 SOS Email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send SOS email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
  }
};

// ==========================================
// ROUTES
// ==========================================
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SheShield Women Safety API is running 🛡️' });
});

// ---------- AUTH ROUTES ----------

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    user = new User({ name, email, password, phone });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Create default settings for new user
    await Settings.create({ userId: user._id });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
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

    // Get all guardians for this user
    const guardians = await Guardian.find({ userId: req.userId });
    
    const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS && 
                           process.env.SMTP_USER !== 'your_gmail@gmail.com';

    if (smtpConfigured && guardians.length > 0) {
      // Fire-and-forget: Send SOS emails in background (parallel) without blocking the response
      guardians.forEach(guardian => {
        if (guardian.email) {
          sendSOSEmail(guardian.email, guardian.name, user.name, lat, lon)
            .catch(error => console.error(`❌ Background SOS email to ${guardian.email} failed:`, error.message));
        }
      });
      
      return res.json({
        success: true,
        status: 'ACTIVATED',
        timestamp: new Date().toISOString(),
        message: `Emergency SOS activated! Dispatching email alerts to ${guardians.length} guardian(s) in background.`
      });
    }

    // If SMTP not configured or no guardians with email
    let message = 'SOS signal activated.';
    if (!smtpConfigured) {
      message += ' Email alerts not configured — please set up SMTP in backend .env file.';
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
    console.error('SOS Error:', err);
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

app.post('/api/incidents/report', authMiddleware, async (req, res) => {
  try {
    const newIncident = new Incident({
      ...req.body,
      userId: req.userId
    });
    await newIncident.save();
    res.json({ success: true, report: newIncident });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/incidents/my-reports', authMiddleware, async (req, res) => {
  try {
    const incidents = await Incident.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- COMMUNITY ROUTES ----------

app.get('/api/community/messages', async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 }).limit(100);
    res.json(posts.reverse()); // Return oldest first for chat display
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/community/message', authMiddleware, async (req, res) => {
  const { content } = req.body;
  try {
    const user = await User.findById(req.userId);
    const newPost = new Post({
      username: user ? user.name : 'Anonymous',
      content,
    });
    await newPost.save();

    // Broadcast to all connected Socket.IO clients
    io.emit('new_message', newPost);

    res.json(newPost);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- GUARDIAN ROUTES ----------

app.get('/api/guardians', authMiddleware, async (req, res) => {
  try {
    const guardians = await Guardian.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json({ success: true, guardians });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/guardians', authMiddleware, async (req, res) => {
  try {
    const { guardians } = req.body; // Array of guardian objects

    // Delete existing guardians for this user and replace with new list
    await Guardian.deleteMany({ userId: req.userId });

    const guardianDocs = guardians.map(g => ({
      userId: req.userId,
      name: g.name,
      relation: g.relation,
      phone: g.phone,
      email: g.email || ''
    }));

    const saved = await Guardian.insertMany(guardianDocs);
    res.json({ success: true, guardians: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/user/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
      model: "gemini-2.5-flash",
      systemInstruction: "You are the 'SheShield Safety Assistant', a supportive, empathetic, and knowledgeable AI companion integrated into a women's safety app. Your main goal is to provide safety advice, emergency preparedness tips, emotional support, and general guidance. Keep responses concise, helpful, and reassuring. Do not hallucinate emergency services phone numbers; instead, tell them to use the SOS button or call local authorities."
    });

    // Format history for Gemini
    let formattedHistory = history ? history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })) : [];

    // Gemini requires the first message in history to be from 'user'
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ success: true, response: responseText });
  } catch (err) {
    console.error('Bot Error:', err);
    res.status(500).json({ success: false, error: 'Failed to communicate with AI Bot.' });
  }
});

// ---------- ROUTES OPTIMIZE (Real data from frontend's routeService) ----------

app.post('/api/routes/optimize', (req, res) => {
  const { source, destination } = req.body;
  // The frontend already uses real OpenRouteService + Overpass APIs directly.
  // This endpoint is kept for backward compatibility but the frontend 
  // now handles routing via routeService.js with real APIs.
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
server.listen(PORT, () => {
  console.log(`🛡️  SheShield Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
  
  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS && 
                         process.env.SMTP_USER !== 'your_gmail@gmail.com';
  if (smtpConfigured) {
    console.log(`📧 SMTP configured - SOS emails will be sent via ${process.env.SMTP_HOST}`);
  } else {
    console.log(`⚠️  SMTP not configured - SOS emails disabled. Update .env to enable.`);
  }
});
