var express = require('express');
var passport = require('./config/passport');
var router = express.Router();
var userController = require('./controllers/userController')

router.post('/login', userController.login);
router.post('/signup', userController.signup);
router.get('/logout', userController.logout);

module.exports = router;
