var express = require('express');
var router = express.Router();
var userController = require('./controllers/userController')
var theoryController = require('./controllers/theoryController')

// login

router.post('/api/login', userController.login);

router.get("/api/logout", userController.logout);

router.get("/api/user", userController.authMiddleware, userController.user);

// theories

router.post("/api/theory", userController.authMiddleware, theoryController.create);

module.exports = router;
