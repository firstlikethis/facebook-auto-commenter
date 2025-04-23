// server/models/ScanTask.js
const mongoose = require('mongoose');

const ScanTaskSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['one-time', 'recurring'],
    default: 'one-time'
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'canceled'],
    default: 'pending'
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  facebookAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacebookAccount'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  cronExpression: {
    type: String // สำหรับงานที่ทำซ้ำ
  },
  lastRunTime: {
    type: Date
  },
  nextRunTime: {
    type: Date
  },
  settings: {
    postScanLimit: {
      type: Number,
      default: 20
    },
    useParallel: {
      type: Boolean,
      default: false
    },
    workerCount: {
      type: Number,
      default: 3
    },
    headless: {
      type: Boolean,
      default: true
    }
  },
  results: {
    totalGroups: {
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
    errors: [{
      groupId: String,
      message: String,
      timestamp: Date
    }]
  },
  logs: [{
    message: String,
    level: {
      type: String,
      enum: ['info', 'warning', 'error']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const ScanTask = mongoose.model('ScanTask', ScanTaskSchema);
module.exports = ScanTask;