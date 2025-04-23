// server/routes/facebook-accounts.routes.js
const express = require('express');
const router = express.Router();
const fbAccountController = require('../controllers/facebook-account.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect); // Require authentication for all routes

router.get('/', fbAccountController.getAccounts);
router.post('/', fbAccountController.createAccount);
router.get('/:id', fbAccountController.getAccount);
router.put('/:id', fbAccountController.updateAccount);
router.delete('/:id', fbAccountController.deleteAccount);
router.post('/:id/test-login', fbAccountController.testLogin);
router.post('/:id/logout', fbAccountController.logoutAccount);
router.post('/:id/save-cookies', fbAccountController.saveCookies);

module.exports = router;