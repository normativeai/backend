var express = require('express');
var router = express.Router();
var theoryController = require('./controllers/theoryController')
var userController = require('./controllers/userController')

router.route("/users")
	.get(userController.user)

router.route("/theories")
	.get(theoryController.get)
	.post(theoryController.create)

router.route('/theories/:theoryId')
  .get(theoryController.getOne)
  .put(theoryController.update)
  .delete(theoryController.delete)

module.exports = router;
