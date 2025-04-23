// server/models/Setting.js
const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  browserSettings: {
    headless: {
      type: Boolean,
      default: false
    },
    userAgent: {
      type: String,
      default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    blockResources: {
      type: Boolean,
      default: false
    },
    userDataDir: {
      type: String,
      default: './user-data'
    }
  },
  scanSettings: {
    defaultGroupScanLimit: {
      type: Number,
      default: 10
    },
    defaultPostScanLimit: {
      type: Number,
      default: 20
    },
    commentDelay: {
      type: Number,
      default: 5000
    },
    scrollDelay: {
      type: Number,
      default: 3000
    },
    maxConcurrentWorkers: {
      type: Number,
      default: 3
    },
    workerTimeout: {
      type: Number,
      default: 600000 // 10 นาที
    }
  },
  delaySettings: {
    betweenClicks: {
      min: {
        type: Number,
        default: 300
      },
      max: {
        type: Number,
        default: 800
      }
    },
    betweenKeys: {
      min: {
        type: Number,
        default: 50
      },
      max: {
        type: Number,
        default: 150
      }
    },
    beforeComment: {
      min: {
        type: Number,
        default: 1000
      },
      max: {
        type: Number,
        default: 3000
      }
    },
    afterComment: {
      min: {
        type: Number,
        default: 3000
      },
      max: {
        type: Number,
        default: 7000
      }
    },
    betweenGroups: {
      min: {
        type: Number,
        default: 5000
      },
      max: {
        type: Number,
        default: 15000
      }
    }
  },
  humanBehaviorSettings: {
    simulateHumanTyping: {
      type: Boolean,
      default: true
    },
    simulateMouseMovement: {
      type: Boolean,
      default: false
    },
    randomScrolls: {
      type: Boolean,
      default: true
    }
  },
  notificationSettings: {
    enableEmailNotifications: {
      type: Boolean,
      default: false
    },
    emailAddress: {
      type: String
    },
    notifyOnCompletion: {
      type: Boolean,
      default: true
    },
    notifyOnError: {
      type: Boolean,
      default: true
    },
    enableBrowserNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

const Setting = mongoose.model('Setting', SettingSchema);
module.exports = Setting;