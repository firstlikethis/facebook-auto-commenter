// server/utils/cron.js
const cron = require('node-cron');
const ScanTask = require('../models/ScanTask');
const scannerService = require('../services/scannerService');
const logger = require('./logger');

/**
 * ตั้งค่างานที่ทำงานเป็นประจำ
 */
exports.setupCronJobs = () => {
  // ตรวจสอบงานสแกนที่กำหนดเวลาไว้ทุก 1 นาที
  cron.schedule('* * * * *', async () => {
    try {
      // ดึงงานที่ถึงเวลาทำงาน
      const now = new Date();
      const pendingTasks = await ScanTask.find({
        status: 'pending',
        scheduledTime: { $lte: now }
      });
      
      // เริ่มทำงานสแกน
      for (const task of pendingTasks) {
        logger.info(`Starting scheduled task: ${task._id}`);
        await scannerService.queueScanTask(task._id);
      }
      
      // ดึงงานที่ทำซ้ำและถึงเวลาทำงาน
      const recurringTasks = await ScanTask.find({
        type: 'recurring',
        status: 'completed',
        nextRunTime: { $lte: now }
      });
      
      // สร้างงานใหม่สำหรับงานที่ทำซ้ำ
      for (const task of recurringTasks) {
        // สร้างงานใหม่
        const newTask = new ScanTask({
          type: 'one-time',
          status: 'pending',
          groups: task.groups,
          facebookAccount: task.facebookAccount,
          scheduledTime: now,
          settings: task.settings,
          user: task.user
        });
        
        await newTask.save();
        logger.info(`Created new task from recurring task: ${task._id}`);
        
        // อัปเดต nextRunTime
        if (task.cronExpression) {
          const cronParser = require('cron-parser');
          try {
            const interval = cronParser.parseExpression(task.cronExpression);
            task.nextRunTime = interval.next().toDate();
            await task.save();
          } catch (error) {
            logger.error(`Error parsing cron expression: ${error.message}`);
          }
        }
        
        // เริ่มทำงานสแกน
        await scannerService.queueScanTask(newTask._id);
      }
    } catch (error) {
      logger.error(`Error in cron job: ${error.message}`);
    }
  });
  
  // ลบข้อมูลคอมเมนต์เก่าทุกวันเวลาเที่ยงคืน
  cron.schedule('0 0 * * *', async () => {
    try {
      const Comment = require('../models/Comment');
      const Setting = require('../models/Setting');
      
      // ดึงการตั้งค่าการเก็บข้อมูลของแต่ละผู้ใช้
      const settings = await Setting.find({});
      
      for (const setting of settings) {
        // ดึงจำนวนวันที่ต้องการเก็บข้อมูล
        const dataRetentionDays = 30; // ค่าเริ่มต้น
        
        // คำนวณวันที่ตัดข้อมูล
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - dataRetentionDays);
        
        // ลบข้อมูลเก่า
        const result = await Comment.deleteMany({
          user: setting.user,
          createdAt: { $lt: cutoffDate }
        });
        
        logger.info(`Deleted ${result.deletedCount} old comments for user ${setting.user}`);
      }
    } catch (error) {
      logger.error(`Error cleaning up old comments: ${error.message}`);
    }
  });
  
  logger.info('Cron jobs setup completed');
};