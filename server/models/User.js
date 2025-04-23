// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'กรุณาระบุอีเมลที่ถูกต้อง']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// เข้ารหัสรหัสผ่านก่อนบันทึก
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ตรวจสอบรหัสผ่าน
UserSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// สร้าง JWT token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const User = mongoose.model('User', UserSchema);
module.exports = User;

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

// server/models/Keyword.js
const mongoose = require('mongoose');

const KeywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    trim: true
  },
  variations: [{
    type: String,
    trim: true
  }],
  messages: [{
    content: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
  images: [{
    path: {
      type: String
    },
    url: {
      type: String
    },
    weight: {
      type: Number,
      default: 1
    }
  }],
  category: {
    type: String,
    trim: true
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  minTimeBetweenUses: {
    type: Number,
    default: 3600 // วินาที
  },
  totalUses: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Keyword = mongoose.model('Keyword', KeywordSchema);
module.exports = Keyword;

// server/models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  postHash: { 
    type: String, 
    required: true, 
    index: true 
  },
  postId: { 
    type: String,
    index: true
  },
  groupId: { 
    type: String, 
    required: true, 
    index: true 
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  postUrl: { 
    type: String 
  },
  postContent: { 
    type: String,
    maxlength: 1000 // จำกัดที่ 1000 ตัวอักษรแรก
  },
  contentHash: {
    type: String
  },
  authorName: {
    type: String
  },
  keywordMatched: { 
    type: String 
  },
  keywordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Keyword'
  },
  messageUsed: { 
    type: String,
    required: true 
  },
  imageUsed: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  success: {
    type: Boolean,
    default: true
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

// สร้าง compound indexes สำหรับการค้นหาที่มีประสิทธิภาพ
CommentSchema.index({ postHash: 1, groupId: 1 });
CommentSchema.index({ groupId: 1, timestamp: -1 });
CommentSchema.index({ keywordMatched: 1, timestamp: -1 });
CommentSchema.index({ user: 1, timestamp: -1 });

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;

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