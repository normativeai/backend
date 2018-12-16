var express = require('express');
var passport = require('./config/passport');
var router = express.Router();
var userController = require('./controllers/userController')

router.post('/api/login', userController.login);
router.post('/api/signup', userController.signup);
router.get('/api/logout', userController.logout);

module.exports = router;
