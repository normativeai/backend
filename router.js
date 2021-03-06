var express = require('express');
var passport = require('./config/passport');
var router = express.Router();
var userController = require('./controllers/userController')

router.post('/api/login', userController.login);
router.get('/api/newuser', userController.newuser);
router.post('/api/signup', userController.signup);

module.exports = router;
