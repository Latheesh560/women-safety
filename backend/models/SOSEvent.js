const mongoose = require('mongoose');

const SOSDeliverySchema = new mongoose.Schema({
  guardianName: { type: String, default: '' },
  guardianPhone: { type: String, default: '' },
  status: { type: String, enum: ['queued', 'sent', 'failed', 'skipped'], default: 'queued' },
  messageId: { type: String, default: '' },
  callId: { type: String, default: '' },
  error: { type: String, default: '' },
}, { _id: false });

const SOSEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['ACTIVATED', 'DEACTIVATED'], required: true },
  lat: { type: Number, default: 0 },
  lon: { type: Number, default: 0 },
  guardiansCount: { type: Number, default: 0 },
  deliveries: { type: [SOSDeliverySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

SOSEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SOSEvent', SOSEventSchema);
