// server/server.js
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');
const { setupCronJobs } = require('./utils/cron');

// ตั้งค่า unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // ปิด server และจบกระบวนการ
  server.close(() => process.exit(1));
});

// เชื่อมต่อกับ MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// เรียกใช้ฟังก์ชันเชื่อมต่อ
connectDB();

// ตั้งค่างาน cron
setupCronJobs();

// เริ่มการทำงานของ server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// จัดการกับการปิดแบบปลอดภัย
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});