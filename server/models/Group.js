// server/models/Group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  memberCount: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scanEnabled: {
    type: Boolean,
    default: true
  },
  scanInterval: {
    type: Number,
    default: 24 // ชั่วโมง
  },
  postScanLimit: {
    type: Number,
    default: 20
  },
  priority: {
    type: Number,
    default: 0
  },
  category: {
    type: String
  },
  lastScanDate: {
    type: Date
  },
  totalScans: {
    type: Number,
    default: 0
  },
  totalPostsScanned: {
    type: Number,
    default: 0
  },
  totalCommentsPosted: {
    type: Number,
    default: 0
  },
  facebookAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacebookAccount'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Group = mongoose.model('Group', GroupSchema);
module.exports = Group;