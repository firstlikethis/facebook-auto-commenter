// server/services/scannerService.js
const mongoose = require('mongoose');
const path = require('path');
const FacebookService = require('./facebookService');
const logger = require('../utils/logger');
const { generateHash } = require('../utils/helpers');

// Import models
const Comment = require('../models/Comment');
const Group = require('../models/Group');
const Keyword = require('../models/Keyword');
const FacebookAccount = require('../models/FacebookAccount');
const ScanTask = require('../models/ScanTask');
const Setting = require('../models/Setting');

/**
 * Service สำหรับการสแกนกลุ่มและจัดการการคอมเมนต์
 */
class ScannerService {
  constructor() {
    this.scanQueue = [];
    this.isProcessing = false;
    this.activeTasks = new Map(); // Map ของงานที่กำลังทำงานอยู่
  }

  /**
   * เพิ่มงานสแกนเข้าคิว
   */
  async queueScanTask(taskId) {
    try {
      // ดึงข้อมูลงานสแกน
      const task = await ScanTask.findById(taskId)
        .populate('groups')
        .populate('facebookAccount')
        .populate('user');
      
      if (!task) {
        logger.error(`Scan task with ID ${taskId} not found`);
        return false;
      }
      
      // เพิ่มเข้าคิวการสแกน
      this.scanQueue.push(task);
      logger.info(`Scan task ${taskId} added to queue. Queue size: ${this.scanQueue.length}`);
      
      // เริ่มประมวลผลถ้ายังไม่ได้เริ่ม
      if (!this.isProcessing) {
        this.processScanQueue();
      }
      
      return true;
    } catch (error) {
      logger.error(`Error queueing scan task: ${error.message}`);
      return false;
    }
  }

  /**
   * ประมวลผลคิวการสแกน
   */
  async processScanQueue() {
    try {
      // ตั้งค่าสถานะการประมวลผล
      this.isProcessing = true;
      
      while (this.scanQueue.length > 0) {
        // ดึงงานแรกจากคิว
        const task = this.scanQueue.shift();
        
        // ตรวจสอบว่างานถูกยกเลิกหรือไม่
        const updatedTask = await ScanTask.findById(task._id);
        
        if (!updatedTask || updatedTask.status === 'canceled') {
          logger.info(`Task ${task._id} was canceled or removed`);
          continue;
        }
        
        // เริ่มการสแกน
        this.activeTasks.set(task._id.toString(), task);
        
        try {
          // อัปเดตสถานะงาน
          task.status = 'running';
          task.startTime = new Date();
          await task.save();
          
          // เพิ่มบันทึกประวัติ
          this.addTaskLog(task._id, 'เริ่มงานสแกน', 'info');
          
          // ประมวลผลงานสแกน
          await this.processScanTask(task);
          
          // อัปเดตสถานะเมื่อเสร็จสิ้น
          task.status = 'completed';
          task.endTime = new Date();
          await task.save();
          
          // เพิ่มบันทึกประวัติ
          this.addTaskLog(task._id, 'สแกนเสร็จสิ้น', 'info');
        } catch (error) {
          // อัปเดตสถานะเมื่อเกิดข้อผิดพลาด
          task.status = 'failed';
          task.endTime = new Date();
          await task.save();
          
          // เพิ่มบันทึกประวัติข้อผิดพลาด
          this.addTaskLog(task._id, `เกิดข้อผิดพลาด: ${error.message}`, 'error');
          
          logger.error(`Error processing scan task ${task._id}: ${error.message}`);
        }
        
        // ลบงานออกจากรายการที่ทำงานอยู่
        this.activeTasks.delete(task._id.toString());
      }
      
      // ตั้งค่าสถานะการประมวลผลเป็น false เมื่อไม่มีงานเหลืออยู่ในคิว
      this.isProcessing = false;
    } catch (error) {
      logger.error(`Error processing scan queue: ${error.message}`);
      this.isProcessing = false;
    }
  }

  /**
   * ประมวลผลงานสแกน
   */
  async processScanTask(task) {
    try {
      logger.info(`Processing scan task ${task._id} for ${task.groups.length} groups`);
      
      // ดึงการตั้งค่าของผู้ใช้
      const settings = await Setting.findOne({ user: task.user._id });
      
      if (!settings) {
        throw new Error('User settings not found');
      }
      
      // สร้าง Facebook service
      const fbService = new FacebookService(task.facebookAccount, {
        headless: task.settings.headless,
        userAgent: settings.browserSettings.userAgent,
        blockResources: settings.browserSettings.blockResources
      });
      
      // เริ่มต้น Facebook service
      await fbService.initialize();
      
      // ล็อกอินเข้า Facebook
      const loginSuccess = await fbService.login();
      
      if (!loginSuccess) {
        throw new Error(`Failed to login with account ${task.facebookAccount.email}`);
      }
      
      // กำหนดค่าเริ่มต้นสำหรับผลลัพธ์
      task.results = {
        totalGroups: task.groups.length,
        totalPostsScanned: 0,
        totalCommentsPosted: 0,
        errors: []
      };
      
      // สแกนแต่ละกลุ่ม
      for (const group of task.groups) {
        try {
          // เพิ่มบันทึกประวัติ
          this.addTaskLog(task._id, `กำลังสแกนกลุ่ม: ${group.name}`, 'info');
          
          // สแกนโพสต์ในกลุ่ม
          const posts = await fbService.scanGroupPosts(group, {
            postScanLimit: task.settings.postScanLimit,
            commentDelay: settings.scanSettings.commentDelay,
            scrollDelay: settings.scanSettings.scrollDelay
          });
          
          // อัปเดตจำนวนโพสต์ที่สแกน
          task.results.totalPostsScanned += posts.length;
          await task.save();
          
          // ดึงคำสำคัญทั้งหมดที่ใช้งานอยู่
          const keywords = await Keyword.find({ 
            user: task.user._id,
            isActive: true
          });
          
          // ประมวลผลแต่ละโพสต์
          for (const post of posts) {
            try {
              // ตรวจสอบว่าเคยคอมเมนต์แล้วหรือไม่
              const existingComment = await Comment.findOne({
                postHash: generateHash(post.postId || post.url || post.content),
                user: task.user._id
              });
              
              if (existingComment) {
                this.addTaskLog(task._id, `ข้ามโพสต์เนื่องจากเคยคอมเมนต์แล้ว: ${post.postId}`, 'info');
                continue;
              }
              
              // ค้นหาคำสำคัญที่ตรงกัน
              const matchedKeyword = this.findKeywordMatch(post.content, keywords);
              
              if (matchedKeyword) {
                // เลือกข้อความและรูปภาพที่จะใช้
                const message = this.selectRandomMessage(matchedKeyword);
                const image = this.selectRandomImage(matchedKeyword);
                
                this.addTaskLog(
                  task._id, 
                  `พบคำสำคัญ "${matchedKeyword.keyword}" ในโพสต์ ${post.postId}`, 
                  'info'
                );
                
                // คอมเมนต์โพสต์
                if (post.url) {
                  const commentSuccess = await fbService.commentPost(
                    post.url, 
                    message,
                    image ? image.path : null
                  );
                  
                  if (commentSuccess) {
                    // เพิ่มบันทึกประวัติ
                    this.addTaskLog(
                      task._id, 
                      `คอมเมนต์สำเร็จบนโพสต์ ${post.postId}`, 
                      'info'
                    );
                    
                    // บันทึกประวัติการคอมเมนต์
                    await Comment.create({
                      postHash: generateHash(post.postId || post.url || post.content),
                      postId: post.postId,
                      groupId: post.groupId,
                      group: group._id,
                      postUrl: post.url,
                      postContent: post.content ? post.content.substring(0, 1000) : '',
                      contentHash: post.contentHash,
                      authorName: post.authorName,
                      keywordMatched: matchedKeyword.keyword,
                      keywordId: matchedKeyword._id,
                      messageUsed: message,
                      imageUsed: image ? image.path : null,
                      success: true,
                      facebookAccount: task.facebookAccount._id,
                      user: task.user._id
                    });
                    
                    // อัปเดตจำนวนคอมเมนต์
                    task.results.totalCommentsPosted++;
                    await task.save();
                    
                    // อัปเดตสถิติของคำสำคัญ
                    matchedKeyword.totalUses++;
                    matchedKeyword.lastUsedAt = new Date();
                    await matchedKeyword.save();
                    
                    // อัปเดตสถิติของกลุ่ม
                    group.totalCommentsPosted++;
                    await group.save();
                    
                    // รอก่อนทำงานต่อไป
                    await new Promise(resolve => setTimeout(
                      resolve, 
                      settings.scanSettings.commentDelay + Math.random() * 5000
                    ));
                  } else {
                    // บันทึกความล้มเหลว
                    this.addTaskLog(
                      task._id, 
                      `คอมเมนต์ล้มเหลวบนโพสต์ ${post.postId}`, 
                      'warning'
                    );
                    
                    // บันทึกประวัติการคอมเมนต์ (ล้มเหลว)
                    await Comment.create({
                      postHash: generateHash(post.postId || post.url || post.content),
                      postId: post.postId,
                      groupId: post.groupId,
                      group: group._id,
                      postUrl: post.url,
                      postContent: post.content ? post.content.substring(0, 1000) : '',
                      contentHash: post.contentHash,
                      authorName: post.authorName,
                      keywordMatched: matchedKeyword.keyword,
                      keywordId: matchedKeyword._id,
                      messageUsed: message,
                      imageUsed: image ? image.path : null,
                      success: false,
                      facebookAccount: task.facebookAccount._id,
                      user: task.user._id
                    });
                  }
                } else {
                  this.addTaskLog(
                    task._id, 
                    `ไม่พบ URL โพสต์สำหรับโพสต์ ${post.postId}`, 
                    'warning'
                  );
                }
              }
            } catch (error) {
              logger.error(`Error processing post ${post.postId}: ${error.message}`);
              this.addTaskLog(
                task._id, 
                `ข้อผิดพลาดในการประมวลผลโพสต์ ${post.postId}: ${error.message}`, 
                'error'
              );
            }
          }
          
          // อัปเดตสถิติของกลุ่ม
          group.lastScanDate = new Date();
          group.totalScans++;
          group.totalPostsScanned += posts.length;
          await group.save();
          
          // รอก่อนเริ่มสแกนกลุ่มถัดไป
          // แก้ไขส่วนนี้ - เพิ่มการตรวจสอบค่า undefined
          const delayMin = settings.delaySettings?.betweenGroups?.min || 5000;
          const delayMax = settings.delaySettings?.betweenGroups?.max || 15000;
          
          await new Promise(resolve => setTimeout(
            resolve, 
            delayMin + Math.random() * (delayMax - delayMin)
          ));
        } catch (error) {
          logger.error(`Error scanning group ${group.name}: ${error.message}`);
          this.addTaskLog(
            task._id, 
            `ข้อผิดพลาดในการสแกนกลุ่ม ${group.name}: ${error.message}`, 
            'error'
          );
          
          // บันทึกข้อผิดพลาด
          task.results.errors.push({
            groupId: group.groupId,
            message: error.message,
            timestamp: new Date()
          });
          await task.save();
        }
      }
      
      // ปิด Facebook service
      await fbService.close();
      
      return task.results;
    } catch (error) {
      logger.error(`Error processing scan task ${task._id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * ค้นหาคำสำคัญที่ตรงกันเนื้อหา
   */
  findKeywordMatch(content, keywords) {
    if (!content) return null;
    
    const lowerContent = content.toLowerCase();
    
    for (const keyword of keywords) {
      // ตรวจสอบคำสำคัญหลัก
      if (lowerContent.includes(keyword.keyword.toLowerCase())) {
        return keyword;
      }
      
      // ตรวจสอบรูปแบบต่างๆ
      for (const variation of keyword.variations) {
        if (variation && lowerContent.includes(variation.toLowerCase())) {
          return keyword;
        }
      }
    }
    
    return null;
  }

  /**
   * เลือกข้อความสุ่มจากคำสำคัญ
   */
  selectRandomMessage(keyword) {
    if (!keyword.messages || keyword.messages.length === 0) {
      return '';
    }
    
    // คำนวณน้ำหนักทั้งหมด
    let totalWeight = 0;
    for (const message of keyword.messages) {
      totalWeight += message.weight || 1;
    }
    
    // สุ่มตามน้ำหนัก
    let random = Math.random() * totalWeight;
    
    for (const message of keyword.messages) {
      random -= message.weight || 1;
      if (random <= 0) {
        return message.content;
      }
    }
    
    // ใช้แบบสุ่มปกติถ้าไม่มีน้ำหนัก
    return keyword.messages[Math.floor(Math.random() * keyword.messages.length)].content;
  }

  /**
   * เลือกรูปภาพสุ่มจากคำสำคัญ
   */
  selectRandomImage(keyword) {
    if (!keyword.images || keyword.images.length === 0) {
      return null;
    }
    
    // คำนวณน้ำหนักทั้งหมด
    let totalWeight = 0;
    for (const image of keyword.images) {
      totalWeight += image.weight || 1;
    }
    
    // สุ่มตามน้ำหนัก
    let random = Math.random() * totalWeight;
    
    for (const image of keyword.images) {
      random -= image.weight || 1;
      if (random <= 0) {
        return image;
      }
    }
    
    // ใช้แบบสุ่มปกติถ้าไม่มีน้ำหนัก
    return keyword.images[Math.floor(Math.random() * keyword.images.length)];
  }

  /**
   * เพิ่มบันทึกประวัติงาน
   */
  async addTaskLog(taskId, message, level) {
    try {
      await ScanTask.findByIdAndUpdate(
        taskId,
        {
          $push: {
            logs: {
              message,
              level,
              timestamp: new Date()
            }
          }
        }
      );
    } catch (error) {
      logger.error(`Error adding task log: ${error.message}`);
    }
  }

  /**
   * หยุดงานสแกน
   */
  async stopTask(taskId) {
    try {
      // ดึงข้อมูลงานสแกน
      const task = await ScanTask.findById(taskId);
      
      if (!task) {
        return { success: false, message: 'Task not found' };
      }
      
      // ตรวจสอบว่างานกำลังทำงานอยู่
      if (task.status !== 'running' && task.status !== 'pending') {
        return { 
          success: false, 
          message: `Cannot stop task with status: ${task.status}` 
        };
      }
      
      // อัปเดตสถานะงาน
      task.status = 'canceled';
      await task.save();
      
      // ลบงานออกจากคิวถ้ายังอยู่ในคิว
      this.scanQueue = this.scanQueue.filter(item => item._id.toString() !== taskId.toString());
      
      // ถ้างานกำลังทำงานอยู่ ต้องรอให้มันหยุดเอง (ไม่สามารถหยุดได้ทันที)
      if (this.activeTasks.has(taskId.toString())) {
        return { 
          success: true, 
          message: 'Task marked for cancellation. It will stop after current operation completes.' 
        };
      }
      
      return { success: true, message: 'Task stopped successfully' };
    } catch (error) {
      logger.error(`Error stopping task ${taskId}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * ดึงข้อมูลงานที่กำลังทำงานอยู่
   */
  getActiveTasks() {
    return Array.from(this.activeTasks.values());
  }
}

// Create and export service instance
const scannerService = new ScannerService();
module.exports = scannerService;