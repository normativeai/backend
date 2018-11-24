var express = require('express');
var router = express.Router();

var queryController = require('../controllers/queryController');

// Executing query route.
router.get('/queries/:id/exec', queryController.exec);

module.exports = router;
