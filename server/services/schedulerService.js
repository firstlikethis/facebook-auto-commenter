// server/services/schedulerService.js
const ScanTask = require('../models/ScanTask');
const Group = require('../models/Group');
const scannerService = require('./scannerService');
const cron = require('node-cron');
const logger = require('../utils/logger');

/**
 * Service สำหรับจัดการงานตามกำหนดเวลา
 */
class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * เริ่มงานสแกนทันที
   */
  async startScanTask(taskId) {
    try {
      const task = await ScanTask.findById(taskId);
      
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }
      
      if (task.status !== 'pending') {
        throw new Error(`Cannot start task with status ${task.status}`);
      }
      
      // เริ่มงานสแกน
      await scannerService.queueScanTask(taskId);
      
      return { success: true, message: 'Task started successfully' };
    } catch (error) {
      logger.error(`Error starting task: ${error.message}`);
      throw error;
    }
  }

  /**
   * ตั้งงานให้ทำงานตามกำหนดเวลา
   */
  async scheduleTask(task) {
    try {
      // ตรวจสอบว่าเป็นงานทำซ้ำหรือไม่
      if (task.type === 'recurring' && task.cronExpression) {
        const jobId = `task_${task._id}`;
        
        // ยกเลิกงานเดิมถ้ามี
        if (this.jobs.has(jobId)) {
          this.jobs.get(jobId).stop();
        }
        
        // สร้างงาน cron ใหม่
        const job = cron.schedule(task.cronExpression, async () => {
          try {
            // สร้างงานใหม่สำหรับการทำงานครั้งนี้
            const newTask = new ScanTask({
              type: 'one-time',
              status: 'pending',
              groups: task.groups,
              facebookAccount: task.facebookAccount,
              scheduledTime: new Date(),
              settings: task.settings,
              user: task.user
            });
            
            await newTask.save();
            logger.info(`Created new task from recurring task: ${task._id}`);
            
            // เริ่มทำงานสแกน
            await scannerService.queueScanTask(newTask._id);
            
            // อัปเดตเวลาทำงานล่าสุดของงานหลัก
            task.lastRunTime = new Date();
            await task.save();
          } catch (error) {
            logger.error(`Error in scheduled job ${jobId}: ${error.message}`);
          }
        });
        
        // เก็บงาน
        this.jobs.set(jobId, job);
        logger.info(`Scheduled recurring task: ${task._id}`);
        
        return { success: true, message: 'Task scheduled successfully' };
      }
      
      return { success: false, message: 'Task is not recurring' };
    } catch (error) {
      logger.error(`Error scheduling task: ${error.message}`);
      throw error;
    }
  }

  /**
   * ยกเลิกงานที่ตั้งเวลาไว้
   */
  async unscheduleTask(taskId) {
    try {
      const jobId = `task_${taskId}`;
      
      if (this.jobs.has(jobId)) {
        this.jobs.get(jobId).stop();
        this.jobs.delete(jobId);
        logger.info(`Unscheduled task: ${taskId}`);
        return { success: true, message: 'Task unscheduled successfully' };
      }
      
      return { success: false, message: 'Task not found in scheduler' };
    } catch (error) {
      logger.error(`Error unscheduling task: ${error.message}`);
      throw error;
    }
  }

  /**
   * โหลดงานที่ทำซ้ำทั้งหมดเมื่อเริ่มต้นระบบ
   */
  async loadAllRecurringTasks() {
    try {
      const recurringTasks = await ScanTask.find({
        type: 'recurring',
        status: { $ne: 'canceled' }
      });
      
      for (const task of recurringTasks) {
        await this.scheduleTask(task);
      }
      
      logger.info(`Loaded ${recurringTasks.length} recurring tasks`);
    } catch (error) {
      logger.error(`Error loading recurring tasks: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new SchedulerService();