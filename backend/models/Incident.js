const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['Harassment', 'Assault', 'Theft', 'Suspicious', 'Other'], default: 'Other' },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Reported', 'Investigating', 'Resolved', 'Dismissed'], default: 'Reported' },
  lat: { type: String, default: '' },
  lon: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Index for fast lookup by user
IncidentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Incident', IncidentSchema);
