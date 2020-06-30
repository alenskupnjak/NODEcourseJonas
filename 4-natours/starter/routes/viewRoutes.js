const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.use(authController.isLoggedIn);

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/pokus', viewController.pokus);
router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.login);
router.get('/me', authController.protect, viewController.getAccount);

module.exports = router;
