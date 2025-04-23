// server/models/FacebookAccount.js
const mongoose = require('mongoose');

const FacebookAccountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  cookiesPath: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginStatus: {
    type: String,
    enum: ['success', 'failed', 'pending', 'unknown'],
    default: 'unknown'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const FacebookAccount = mongoose.model('FacebookAccount', FacebookAccountSchema);
module.exports = FacebookAccount;