// server/services/facebookService.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs-extra');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { getRandomDelay, generateHash } = require('../utils/helpers');

// ใช้ Stealth plugin เพื่อหลีกเลี่ยงการตรวจจับ
puppeteer.use(StealthPlugin());

class FacebookService {
  constructor(facebookAccount, settings = {}) {
    this.account = facebookAccount;
    this.settings = settings;
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  /**
   * เริ่มต้นการทำงานของ browser
   */
  async initialize() {
    try {
      logger.info(`Initializing Facebook service for account: ${this.account.email}`);
      
      // ตั้งค่า userDataDir สำหรับแต่ละบัญชี
      const userDataDir = this.account.cookiesPath || 
        path.join(process.cwd(), 'user-data', `account_${this.account._id}`);
      
      // ตรวจสอบว่าไดเรกทอรีมีอยู่
      fs.ensureDirSync(userDataDir);
      
      // บันทึกที่อยู่ไดเรกทอรี
      if (!this.account.cookiesPath) {
        this.account.cookiesPath = userDataDir;
        await this.account.save();
      }
      
      // ตั้งค่าการเปิด browser
      const browserOptions = {
        headless: this.settings.headless !== undefined ? this.settings.headless : false,
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--disable-notifications',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        ignoreHTTPSErrors: true,
        userDataDir
      };
      
      this.browser = await puppeteer.launch(browserOptions);
      this.page = await this.browser.newPage();
      
      // ตั้งค่า user agent
      await this.page.setUserAgent(
        this.settings.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );
      
      // ตั้งค่า viewport
      await this.page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
      
      // ตั้งค่าการบล็อกทรัพยากร (ถ้ามีการเปิดใช้งาน)
      if (this.settings.blockResources) {
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
          if (req.resourceType() === 'image' || 
              req.resourceType() === 'stylesheet' || 
              req.resourceType() === 'font') {
            req.abort();
          } else {
            req.continue();
          }
        });
      }
      
      // ตั้งค่า timeout สำหรับการนำทาง
      this.page.setDefaultNavigationTimeout(60000);
      
      logger.info(`Facebook service initialized successfully for account: ${this.account.email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Facebook service: ${error.message}`);
      throw error;
    }
  }

  /**
   * ล็อกอินเข้าสู่ Facebook
   */
  async login() {
    try {
      logger.info(`Attempting to login to Facebook with account: ${this.account.email}`);
      
      // ตรวจสอบว่ามีอีเมลและรหัสผ่านหรือไม่
      if (!this.account.email || !this.account.password) {
        logger.error('Facebook email or password not provided');
        throw new Error('Facebook email and password are required');
      }
      
      // นำทางไปยังหน้าแรกของ Facebook
      await this.page.goto('https://www.facebook.com', { waitUntil: 'networkidle2' });
      
      // รอให้หน้าเว็บโหลดเสร็จสมบูรณ์
      await this.page.waitForTimeout(5000);
      
      // ตรวจสอบการล็อกอิน
      const isLoggedIn = await this.checkIfLoggedIn();
      
      if (isLoggedIn) {
        logger.info(`Already logged in with account: ${this.account.email}`);
        this.isLoggedIn = true;
        
        // อัปเดตสถานะล็อกอิน
        this.account.loginStatus = 'success';
        this.account.lastLogin = new Date();
        await this.account.save();
        
        return true;
      }
      
      // ดำเนินการล็อกอินด้วยอีเมลและรหัสผ่าน
      await this.performLogin();
      
      return this.isLoggedIn;
    } catch (error) {
      logger.error(`Login failed: ${error.message}`);
      
      // อัปเดตสถานะล็อกอิน
      this.account.loginStatus = 'failed';
      await this.account.save();
      
      throw error;
    }
  }

  /**
   * ดำเนินการล็อกอิน
   */
  async performLogin() {
    try {
      // รอให้ฟอร์มล็อกอินปรากฏ
      await this.page.waitForSelector('#email', { timeout: 10000 });
      
      // พักเล็กน้อย
      await this.page.waitForTimeout(Math.random() * 1000 + 500);
      
      // คลิกที่ช่องอีเมล
      await this.page.click('#email');
      await this.page.waitForTimeout(Math.random() * 500 + 300);
      
      // พิมพ์อีเมลแบบเหมือนมนุษย์
      await this.typeHumanLike('#email', this.account.email);
      
      // พักเล็กน้อยก่อนพิมพ์รหัสผ่าน
      await this.page.waitForTimeout(Math.random() * 1000 + 500);
      
      // คลิกที่ช่องรหัสผ่าน
      await this.page.click('#pass');
      await this.page.waitForTimeout(Math.random() * 500 + 300);
      
      // พิมพ์รหัสผ่านแบบเหมือนมนุษย์
      await this.typeHumanLike('#pass', this.account.password);
      
      // พักเล็กน้อยก่อนคลิกปุ่มล็อกอิน
      await this.page.waitForTimeout(Math.random() * 1000 + 800);
      
      // คลิกปุ่มล็อกอิน
      await Promise.all([
        this.page.click('button[name="login"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
      ]);
      
      // รอให้หน้าเว็บโหลดเสร็จสมบูรณ์
      await this.page.waitForTimeout(5000);
      
      // ตรวจสอบการล็อกอิน
      this.isLoggedIn = await this.checkIfLoggedIn();
      
      if (this.isLoggedIn) {
        logger.info(`Login successful for account: ${this.account.email}`);
        
        // อัปเดตสถานะล็อกอิน
        this.account.loginStatus = 'success';
        this.account.lastLogin = new Date();
        await this.account.save();
        
        return true;
      } else {
        logger.error(`Login failed for account: ${this.account.email}`);
        
        // อัปเดตสถานะล็อกอิน
        this.account.loginStatus = 'failed';
        await this.account.save();
        
        throw new Error('Login failed');
      }
    } catch (error) {
      logger.error(`Login process failed: ${error.message}`);
      
      // อัปเดตสถานะล็อกอิน
      this.account.loginStatus = 'failed';
      await this.account.save();
      
      throw error;
    }
  }

  /**
   * พิมพ์ข้อความแบบเหมือนมนุษย์
   */
  async typeHumanLike(selector, text) {
    for (let i = 0; i < text.length; i++) {
      await this.page.type(selector, text[i], { delay: Math.floor(Math.random() * 100) + 50 });
      
      // หยุดพักเป็นระยะ
      if (Math.random() < 0.1) {
        await this.page.waitForTimeout(Math.floor(Math.random() * 300) + 100);
      }
    }
  }

  /**
   * ตรวจสอบว่าล็อกอินแล้วหรือไม่
   */
  async checkIfLoggedIn() {
    try {
      // รอสักครู่
      await this.page.waitForTimeout(3000);
      
      return await this.page.evaluate(() => {
        // ตรวจสอบสิ่งที่ปรากฏเฉพาะเมื่อล็อกอินแล้ว
        return !!document.querySelector('[aria-label="Your profile"]') || 
               !!document.querySelector('[aria-label="โปรไฟล์ของคุณ"]') ||
               !!document.querySelector('[data-pagelet="LeftRail"]') ||
               window.location.href.includes('/home.php') ||
               window.location.href.includes('/profile.php');
      });
    } catch (error) {
      logger.error(`Error checking login status: ${error.message}`);
      return false;
    }
  }

  /**
   * ดึงข้อมูลกลุ่ม Facebook ที่เป็นสมาชิก
   */
  async detectGroups() {
    logger.info(`Detecting groups for account: ${this.account.email}`);
    
    try {
      // ตรวจสอบการล็อกอิน
      if (!this.isLoggedIn) {
        await this.login();
      }
      
      // นำทางไปยังหน้ากลุ่ม
      await this.page.goto('https://www.facebook.com/groups/joins/', { waitUntil: 'networkidle2' });
      
      // รอให้เนื้อหาหลักโหลด
      await this.page.waitForSelector('div[role="main"]', { timeout: 30000 });
      
      // เลื่อนหน้าเพื่อโหลดกลุ่มทั้งหมด
      await this.smoothScroll();
      
      // รอสักครู่
      await this.page.waitForTimeout(Math.random() * 1000 + 2000);
      
      // ดึงข้อมูลกลุ่ม
      const groupLinks = await this.page.evaluate(() => {
        // หาลิงก์กลุ่มทั้งหมด
        const links = Array.from(document.querySelectorAll('a[href*="/groups/"]'))
          .filter(el => {
            const href = el.getAttribute('href');
            return href && 
                  href.includes('/groups/') && 
                  !href.includes('/groups/feed') && 
                  !href.includes('/groups/discover') && 
                  !href.includes('/groups/joins') && 
                  !href.includes('/help');
          });
        
        // กำจัดลิงก์ที่ซ้ำกัน
        const uniqueLinks = new Map();
        
        links.forEach(el => {
          const href = el.getAttribute('href');
          
          if (!uniqueLinks.has(href) || el.textContent.trim().length > uniqueLinks.get(href).text.length) {
            uniqueLinks.set(href, {
              href: href,
              text: el.textContent.trim(),
              parentText: el.closest('div')?.textContent.trim().substring(0, 100) || ''
            });
          }
        });
        
        return Array.from(uniqueLinks.values());
      });
      
      logger.info(`Found ${groupLinks.length} potential group links`);
      
      // แปลงข้อมูลกลุ่ม
      const groups = groupLinks.map(item => {
        // ดึง group ID
        let groupId = '';
        const groupIdMatch = item.href.match(/\/groups\/([^/?]+)/);
        if (groupIdMatch && groupIdMatch[1]) {
          groupId = groupIdMatch[1];
        }
        
        // ดึงชื่อกลุ่ม
        let name = item.text;
        
        // ถ้าชื่อสั้นเกินไป ลองใช้ข้อความจาก parent
        if (name.length < 3 && item.parentText) {
          name = item.parentText.replace(/join|leave|ออกจากกลุ่ม|เข้าร่วมกลุ่ม|like|comment|share|ถูกใจ|แสดงความคิดเห็น|แชร์/gi, '').trim();
        }
        
        // สร้าง URL ที่สมบูรณ์
        let url = item.href;
        if (!url.startsWith('http')) {
          url = 'https://www.facebook.com' + url;
        }
        
        return {
          groupId,
          name,
          url
        };
      });
      
      // กรองข้อมูลกลุ่มที่ไม่ถูกต้อง
      const validGroups = groups.filter(group => {
        // ต้องมี groupId
        if (!group.groupId) return false;
        
        // กรอง groupId "joins"
        if (group.groupId === "joins") return false;
        
        // ชื่อต้องมีความหมาย
        if (group.name.length < 2) return false;
        
        // กรองรายการนำทาง
        const invalidNames = ['join', 'leave', 'see more', 'see all', 'ดูเพิ่มเติม', 'ดูทั้งหมด', 'เข้าร่วม', 'ออก'];
        for (const invalid of invalidNames) {
          if (group.name.toLowerCase() === invalid) return false;
        }
        
        // กรอง groupId ที่เป็นคำพิเศษของ Facebook
        const invalidGroupIds = ['joins', 'discover', 'feed', 'create', 'browse', 'search'];
        if (invalidGroupIds.includes(group.groupId.toLowerCase())) return false;
        
        // ตรวจสอบ URL ว่าเป็น URL ของกลุ่มจริง ๆ
        return group.url.includes('/groups/') && !group.url.includes('/groups/joins');
      });
      
      logger.info(`Found ${validGroups.length} valid groups`);
      
      return validGroups;
    } catch (error) {
      logger.error(`Error detecting groups: ${error.message}`);
      throw error;
    }
  }

  /**
   * เลื่อนหน้าเว็บอย่างนุ่มนวลเพื่อโหลดข้อมูลเพิ่มเติม
   */
  async smoothScroll() {
    await this.page.evaluate(async () => {
      await new Promise((resolve) => {
        let scrollAttempts = 0;
        const maxScrollAttempts = 25;
        
        const timer = setInterval(() => {
          const distance = Math.floor(Math.random() * 200) + 100;
          window.scrollBy(0, distance);
          scrollAttempts++;
          
          if (scrollAttempts >= maxScrollAttempts || 
              window.innerHeight + window.scrollY >= document.body.scrollHeight - 200) {
            clearInterval(timer);
            setTimeout(resolve, Math.floor(Math.random() * 1000) + 500);
          }
        }, Math.floor(Math.random() * 100) + 200);
      });
    });
  }

  /**
   * แสกนโพสต์ในกลุ่ม
   */
  async scanGroupPosts(group, options = {}) {
    const {
      postScanLimit = 20,
      commentDelay = 5000,
      scrollDelay = 3000
    } = options;
    
    logger.info(`Scanning group: ${group.name} (${group.groupId})`);
    
    try {
      // ตรวจสอบการล็อกอิน
      if (!this.isLoggedIn) {
        await this.login();
      }
      
      // นำทางไปยังหน้ากลุ่ม
      await this.page.goto(group.url, { waitUntil: 'networkidle2' });
      
      // รอให้ feed โหลด
      await this.page.waitForSelector('[role="feed"]', { timeout: 30000 }).catch(() => {
        throw new Error(`Feed not found in group ${group.name}`);
      });
      
      // รอสักครู่
      await this.page.waitForTimeout(Math.random() * 2000 + 2000);
      
      // เลื่อนไปด้านบนสุดของหน้า
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      
      await this.page.waitForTimeout(Math.random() * 1000 + 1000);
      
      // กำหนดตัวแปรติดตาม
      let scannedPosts = 0;
      let totalPostsInGroup = 0;
      const postDataArray = [];
      
      // สแกนโพสต์จนถึงขีดจำกัด
      while (scannedPosts < postScanLimit) {
        // นับจำนวนโพสต์ที่มองเห็น
        const visiblePostCount = await this.page.evaluate(() => {
          return document.querySelectorAll('[role="article"]').length;
        });
        
        // ถ้าไม่พบโพสต์
        if (visiblePostCount === 0) {
          logger.info('No posts found in this page');
          break;
        }
        
        // อัปเดตจำนวนโพสต์ทั้งหมด
        if (visiblePostCount > totalPostsInGroup) {
          totalPostsInGroup = visiblePostCount;
        }
        
        // ดึงข้อมูลโพสต์
        const posts = await this.page.$$('[role="article"]');
        logger.info(`Found ${posts.length} posts in current view`);
        
        // คำนวณจำนวนโพสต์ที่จะสแกนในรอบนี้
        const postsToScanThisRound = Math.min(posts.length, postScanLimit - scannedPosts);
        
        // สแกนโพสต์
        for (let j = 0; j < postsToScanThisRound; j++) {
          const currentPostIndex = scannedPosts;
          scannedPosts++;
          
          const post = posts[j];
          logger.info(`Extracting data from post ${currentPostIndex + 1}`);
          
          // เลื่อนไปยังโพสต์
          await this.page.evaluate((postElement) => {
            postElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }, post);
          
          // รอหลังจากเลื่อน
          await this.page.waitForTimeout(Math.random() * 1000 + 500);
          
          // ดึงข้อมูลโพสต์
          const postData = await this.extractPostData(post, group);
          
          if (postData) {
            postDataArray.push(postData);
          }
        }
        
        // หยุดถ้าสแกนโพสต์ทั้งหมดในกลุ่มแล้ว
        if (scannedPosts >= totalPostsInGroup) {
          logger.info(`Scanned all ${totalPostsInGroup} posts in group`);
          break;
        }
        
        // เลื่อนเพื่อโหลดโพสต์เพิ่มเติม
        const previousHeight = await this.page.evaluate(() => document.body.scrollHeight);
        
        await this.page.evaluate(() => {
          const distance = Math.floor(Math.random() * 500) + 300;
          window.scrollBy(0, distance);
        });
        
        // รอให้เนื้อหาใหม่โหลด
        await this.page.waitForTimeout(scrollDelay + Math.random() * 2000);
        
        // ตรวจสอบว่าโหลดเนื้อหาใหม่หรือไม่
        const newHeight = await this.page.evaluate(() => document.body.scrollHeight);
        
        if (newHeight === previousHeight) {
          logger.info('No more posts loaded, ending scan');
          break;
        }
      }
      
      logger.info(`Group scan completed: ${scannedPosts} posts scanned`);
      
      return postDataArray;
    } catch (error) {
      logger.error(`Error scanning group ${group.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลจากโพสต์
   */
  async extractPostData(postElement, group) {
    try {
      // ดึงเนื้อหาโพสต์
      const postContent = await this.page.evaluate(post => {
        // พยายามหาเนื้อหาในโพสต์
        const contentDiv = post.querySelector('[data-ad-comet-preview="message"]') || 
                           post.querySelector('[data-ad-preview="message"]') ||
                           post.querySelector('div[dir="auto"][style]') ||
                           post.querySelector('div[dir="auto"]');
        
        if (contentDiv) {
          return contentDiv.innerText;
        }
        
        // ใช้ข้อความทั้งหมดของโพสต์เป็นทางเลือกสุดท้าย
        let fullText = post.innerText || '';
        
        // กรองข้อความของ UI
        const filterTexts = ['Like', 'Comment', 'Share', 'ถูกใจ', 'แสดงความคิดเห็น', 'แชร์', 'hr', 'min', 'ชั่วโมง', 'นาที', 'วันนี้', 'เมื่อวาน'];
        
        for (const filter of filterTexts) {
          fullText = fullText.replace(new RegExp(filter, 'gi'), '');
        }
        
        return fullText;
      }, postElement);
      
      // สร้าง hash ของเนื้อหาโพสต์
      const contentHash = generateHash(postContent || '');
      
      // ดึง post ID
      const postId = await this.page.evaluate(post => {
        // วิธีที่ 1: ค้นหาลิงก์ที่อาจมี post ID
        const links = Array.from(post.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid="]'));
        
        for (const link of links) {
          const href = link.getAttribute('href');
          
          // ตรวจสอบรูปแบบ URL ที่แตกต่างกัน
          // รูปแบบ: /posts/{id}
          let match = href.match(/\/posts\/(\d+)/);
          if (match && match[1]) return match[1];
          
          // รูปแบบ: /permalink/{id}
          match = href.match(/\/permalink\/(\d+)/);
          if (match && match[1]) return match[1];
          
          // รูปแบบ: story_fbid={id}
          match = href.match(/story_fbid=(\d+)/);
          if (match && match[1]) return match[1];
        }
        
        // วิธีที่ 2: ตรวจสอบ data attributes
        const possibleIdElements = Array.from(post.querySelectorAll('[data-ft]'));
        
        for (const element of possibleIdElements) {
          const dataFt = element.getAttribute('data-ft');
          try {
            const dataObj = JSON.parse(dataFt);
            if (dataObj.top_level_post_id) return dataObj.top_level_post_id;
            if (dataObj.content_id) return dataObj.content_id;
          } catch (e) {
            // ถ้าการแปลง JSON ล้มเหลว ลองใช้ regex
            const match = dataFt.match(/(?:top_level_post_id|content_id)[":,\s]+([\d]+)/);
            if (match && match[1]) return match[1];
          }
        }
        
        return '';
      }, postElement);
      
      // ดึงชื่อผู้โพสต์
      const authorName = await this.page.evaluate(post => {
        // ค้นหาลิงก์โปรไฟล์
        const profileLinks = Array.from(post.querySelectorAll('a[href*="/user/"], a[href*="/profile.php"], a[role="link"][tabindex="0"]'));
        
        for (const link of profileLinks) {
          // ตรวจสอบว่าลิงก์มีข้อความ
          const text = link.textContent.trim();
          if (text && text.length > 0 && !text.includes('Like') && !text.includes('ถูกใจ')) {
            // ตรวจสอบว่าเป็นชื่อบุคคลจริง
            const href = link.getAttribute('href');
            if (href && (href.includes('/user/') || href.includes('/profile.php') || !href.includes('/groups/'))) {
              return text;
            }
          }
        }
        
        return '';
      }, postElement);
      
      // ดึง URL โพสต์
      const postUrl = await this.page.evaluate(post => {
        // ค้นหาลิงก์ permalink
        const permalinkSelector = 'a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid="]';
        const permalinkElements = post.querySelectorAll(permalinkSelector);
        
        if (permalinkElements.length > 0) {
          // แปลงเป็นอาร์เรย์และกรองเฉพาะ permalinks จริง
          const links = Array.from(permalinkElements).filter(el => {
            const href = el.getAttribute('href');
            return href && !href.includes('comment_id') && !href.includes('action_comment');
          });
          
          if (links.length > 0) {
            return links[0].getAttribute('href');
          }
        }
        
        return '';
      }, postElement);
      
      // สร้าง URL ที่สมบูรณ์
      let fullPostUrl = postUrl;
      if (postUrl && !postUrl.startsWith('http')) {
        fullPostUrl = 'https://www.facebook.com' + postUrl;
      }
      
      // สร้าง identifier ที่ไม่ซ้ำกันสำหรับโพสต์
      const uniqueIdentifier = postId || `${group.groupId}_${contentHash}`;
      
      // สร้างข้อมูลโพสต์
      return {
        content: postContent,
        postId: uniqueIdentifier,
        authorName: authorName,
        url: fullPostUrl,
        timestamp: Date.now(),
        groupId: group.groupId,
        groupName: group.name,
        contentHash: contentHash
      };
    } catch (error) {
      logger.error(`Error extracting post data: ${error.message}`);
      return null;
    }
  }

  /**
   * คอมเมนต์โพสต์
   */
  async commentPost(postUrl, message, imageUrl = null) {
    try {
      logger.info(`Commenting on post: ${postUrl}`);
      
      // ตรวจสอบการล็อกอิน
      if (!this.isLoggedIn) {
        await this.login();
      }
      
      // นำทางไปยังโพสต์
      await this.page.goto(postUrl, { waitUntil: 'networkidle2' });
      
      // รอให้โพสต์โหลด
      await this.page.waitForSelector('[role="article"]', { timeout: 30000 });
      
      // รอสักครู่
      await this.page.waitForTimeout(Math.random() * 2000 + 2000);
      
      // หาปุ่มคอมเมนต์
      const commentButton = await this.page.$('div[aria-label="Comment" i], div[aria-label="แสดงความคิดเห็น" i]');
      
      if (!commentButton) {
        logger.info('Comment button not found');
        return false;
      }
      
      // คลิกปุ่มคอมเมนต์
      await commentButton.click();
      
      // รอให้กล่องข้อความคอมเมนต์ปรากฏ
      await this.page.waitForSelector('div[contenteditable="true"][role="textbox"]', { timeout: 10000 });
      
      // รอก่อนคลิกกล่องข้อความ
      await this.page.waitForTimeout(Math.random() * 1000 + 500);
      
      // หาและคลิกกล่องข้อความคอมเมนต์
      const commentBox = await this.page.$('div[contenteditable="true"][role="textbox"]');
      if (!commentBox) {
        logger.info('Comment input not found');
        return false;
      }
      
      await commentBox.click();
      
      // รอก่อนพิมพ์
      await this.page.waitForTimeout(Math.random() * 500 + 300);
      
      // พิมพ์คอมเมนต์แบบเหมือนมนุษย์
      for (let i = 0; i < message.length; i++) {
        await this.page.keyboard.type(message[i], { delay: Math.floor(Math.random() * 100) + 50 });
        
        // หยุดพักเป็นระยะขณะพิมพ์
        if (Math.random() < 0.1) {
          await this.page.waitForTimeout(Math.floor(Math.random() * 300) + 100);
        }
      }
      
      // แนบรูปภาพถ้ามี
      if (imageUrl) {
        try {
          const imagePath = path.resolve(imageUrl);
          
          // ตรวจสอบว่าไฟล์มีอยู่
          if (fs.existsSync(imagePath)) {
            // รอก่อนคลิกปุ่มแนบไฟล์
            await this.page.waitForTimeout(Math.random() * 1000 + 1000);
            
            // หา input ไฟล์
            const fileInput = await this.page.$('input[type="file"][accept^="image/"]');
            
            if (fileInput) {
              // อัปโหลดไฟล์
              await fileInput.uploadFile(imagePath);
              
              // รอให้การอัปโหลดเสร็จสิ้น
              await this.page.waitForTimeout(Math.random() * 2000 + 3000);
            } else {
              logger.info('File input not found');
            }
          } else {
            logger.info(`Image file not found: ${imagePath}`);
          }
        } catch (err) {
          logger.error(`Error uploading image: ${err.message}`);
        }
      }
      
      // รอก่อนส่ง
      await this.page.waitForTimeout(Math.random() * 700 + 800);
      
      // กด Enter เพื่อส่งคอมเมนต์
      await this.page.keyboard.press('Enter');
      
      // รอให้คอมเมนต์โพสต์เสร็จ
      await this.page.waitForTimeout(Math.random() * 2000 + 3000);
      
      logger.info('Comment posted successfully');
      return true;
    } catch (error) {
      logger.error(`Error posting comment: ${error.message}`);
      return false;
    }
  }

  /**
   * ตรวจสอบ Checkpoint หรือการยืนยันตัวตน
   */
  async checkForCheckpoint() {
    try {
      // ตรวจสอบหน้า checkpoint
      const isCheckpoint = await this.page.evaluate(() => {
        return window.location.href.includes('checkpoint') || 
               !!document.querySelector('#checkpointSubmitButton') ||
               !!document.querySelector('form[action*="checkpoint"]');
      });
      
      if (isCheckpoint) {
        logger.warn(`Checkpoint detected for account: ${this.account.email}`);
        
        // บันทึก screenshot
        const screenshotPath = path.join(
          process.cwd(), 
          'logs', 
          'checkpoints', 
          `checkpoint_${this.account._id}_${Date.now()}.png`
        );
        
        fs.ensureDirSync(path.dirname(screenshotPath));
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        
        logger.info(`Checkpoint screenshot saved to: ${screenshotPath}`);
        
        return { isCheckpoint: true, screenshotPath };
      }
      
      return { isCheckpoint: false };
    } catch (error) {
      logger.error(`Error checking for checkpoint: ${error.message}`);
      return { isCheckpoint: false, error: error.message };
    }
  }

  /**
   * บันทึก cookies
   */
  async saveCookies() {
    try {
      if (!this.browser || !this.page) {
        throw new Error('Browser or page not initialized');
      }
      
      const cookies = await this.page.cookies();
      
      // สร้าง path สำหรับบันทึก cookies
      const cookiesDir = path.join(process.cwd(), 'cookies');
      fs.ensureDirSync(cookiesDir);
      
      const cookiesPath = path.join(cookiesDir, `${this.account._id}.json`);
      
      // บันทึก cookies
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
      
      // อัปเดต account
      this.account.cookiesPath = cookiesPath;
      await this.account.save();
      
      logger.info(`Cookies saved for account: ${this.account.email}`);
      
      return true;
    } catch (error) {
      logger.error(`Error saving cookies: ${error.message}`);
      return false;
    }
  }

  /**
   * โหลด cookies
   */
  async loadCookies() {
    try {
      if (!this.browser || !this.page) {
        throw new Error('Browser or page not initialized');
      }
      
      // ตรวจสอบว่ามีไฟล์ cookies หรือไม่
      if (!this.account.cookiesPath || !fs.existsSync(this.account.cookiesPath)) {
        logger.info(`No cookies file found for account: ${this.account.email}`);
        return false;
      }
      
      // โหลด cookies
      const cookiesString = fs.readFileSync(this.account.cookiesPath, 'utf8');
      const cookies = JSON.parse(cookiesString);
      
      // เพิ่ม cookies ลงใน page
      for (const cookie of cookies) {
        await this.page.setCookie(cookie);
      }
      
      logger.info(`Cookies loaded for account: ${this.account.email}`);
      
      return true;
    } catch (error) {
      logger.error(`Error loading cookies: ${error.message}`);
      return false;
    }
  }

  /**
   * ปิด browser
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        logger.info(`Browser closed for account: ${this.account.email}`);
      }
    } catch (error) {
      logger.error(`Error closing browser: ${error.message}`);
    }
  }

  /**
   * ล็อกเอาต์จาก Facebook
   */
  async logout() {
    try {
      logger.info(`Logging out account: ${this.account.email}`);
      
      // ตรวจสอบการล็อกอิน
      if (!this.isLoggedIn) {
        logger.info(`Account ${this.account.email} is not logged in`);
        return true;
      }
      
      // นำทางไปยังหน้าแรกของ Facebook
      await this.page.goto('https://www.facebook.com', { waitUntil: 'networkidle2' });
      
      // คลิกที่เมนู account
      await this.page.click('[aria-label="Account"] span, [aria-label="บัญชีผู้ใช้"] span, [aria-label="Your profile"] span, [aria-label="โปรไฟล์ของคุณ"] span');
      
      // รอให้เมนูปรากฏ
      await this.page.waitForTimeout(1000);
      
      // คลิกที่ปุ่ม logout
      await this.page.click('text/Log Out, text/ออกจากระบบ');
      
      // รอให้ล็อกเอาต์เสร็จสิ้น
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // ตรวจสอบว่าล็อกเอาต์แล้ว
      this.isLoggedIn = await this.checkIfLoggedIn();
      
      if (!this.isLoggedIn) {
        logger.info(`Logout successful for account: ${this.account.email}`);
        
        // อัปเดตสถานะล็อกอิน
        this.account.loginStatus = 'unknown';
        await this.account.save();
        
        return true;
      } else {
        logger.error(`Logout failed for account: ${this.account.email}`);
        return false;
      }
    } catch (error) {
      logger.error(`Logout failed: ${error.message}`);
      return false;
    }
  }
}

// Export service
module.exports = FacebookService;