var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController')

router.post('/api/login', userController.login);

router.get("/api/logout", userController.logout);

router.get("/api/user", userController.authMiddleware, userController.user);

module.exports = router;
