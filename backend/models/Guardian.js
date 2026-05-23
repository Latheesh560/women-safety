const mongoose = require('mongoose');

const GuardianSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  relation: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Index for fast lookup by user
GuardianSchema.index({ userId: 1 });

module.exports = mongoose.model('Guardian', GuardianSchema);
