var express = require('express');
var router = express.Router();
var theoryController = require('./controllers/theoryController')
var queryController = require('./controllers/queryController')
var userController = require('./controllers/userController')

router.route("/users")
	.get(userController.user)

router.route('/logout')
  .get(userController.logout);

router.route("/theories")
	.get(theoryController.get)
	.post(theoryController.create)

router.route("/theories/find")
	.get(theoryController.find)

router.route('/theories/:theoryId/consistency')
  .get(theoryController.consistency)

router.route('/theories/:theoryId')
  .get(theoryController.getOne)
  .post(theoryController.clone)
  .put(theoryController.update)
  .delete(theoryController.delete)

router.route("/queries")
	.post(queryController.create)


module.exports = router;
