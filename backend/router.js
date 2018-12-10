var express = require('express');
var router = express.Router();
var userController = require('./controllers/userController')
var theoryController = require('./controllers/theoryController')

router.post('/api/login', userController.login);
router.get("/api/logout", userController.logout);

router.route("/api/users")
	.get(userController.authMiddleware, userController.user)
	.post(userController.create)

router.route("/api/theories")
	.get(userController.authMiddleware, theoryController.get)
	.post(userController.authMiddleware, theoryController.create)

module.exports = router;
