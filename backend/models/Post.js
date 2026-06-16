const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  username: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  replyTo: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    username: String,
    content: String
  }
});

module.exports = mongoose.model('Post', PostSchema);
