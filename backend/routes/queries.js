var express = require('express');
var router = express.Router();

var queryController = require('../controllers/queryController');

// Executing query route.
router.get('/queries/:name/exec', queryController.exec);

module.exports = router;
