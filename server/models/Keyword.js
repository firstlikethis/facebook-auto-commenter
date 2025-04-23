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