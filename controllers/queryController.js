var Query = require('../models/query');
var User= require('../models/user');
var logger = require('../config/winston');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.create = [
  body('name', 'Query name required').isLength({ min: 1 }).trim(),
  sanitizeBody('name').trim().escape(),

  function(req, res, next) {
    if (req.user.writeProtected) {
      logger.error(`Query of user ${JSON.stringify(req.user)} cannot be created since the user is write protected`);
      res.status(400).json({"error": 'Query cannot be created since the user is write protected'});
    } else {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
          logger.error(`Query of user ${JSON.stringify(req.user)} cannot be created: ${errors.array()}`);
          return res.status(422).json({ errors: errors.array() });
      }

      Query.create({
        _id: req.body._id,
        name: req.body.name,
        lastUpdate: new Date(),
        user: req.user,
        theory: req.body.theory,
        description: req.body.description,
        assumptions: req.body.assumptions,
        content: req.body.content,
        goal: req.body.goal
      }).then(query => {
        User.findById(req.user._id, function(err, user) {
          user.queries.push(query._id);
          user.save(err => {
            if (err) {
              logger.error(`Query of user ${JSON.stringify(req.user)} cannot be created: ${err}`);
              res.status(400).json({ error: err});
            } else {
              logger.info(`Query of user ${JSON.stringify(req.user)} created`);
              res.status(201).json({"data": query});
            }
        })})}).catch(function(error) {
            logger.error(`Query of user ${JSON.stringify(req.user)} cannot be created: ${error}`);
            res.status(400).json(error);
          });
    }
  }
]

exports.get = function(req, res, next) {
  Query.find({ "user": req.user }, ['_id', 'lastUpdate', 'name', 'description'], {"sort": {"_id": 1}}, function (err, queries) {
    res.json({"data": queries})
  });
};

exports.getOne = function(req, res, next) {
  Query.findById(req.params.queryId, ['_id', 'lastUpdate', 'name', 'description', 'content', 'assumptions', 'autoAssumptions', 'goal', 'autoGoal'])
    .populate('theory', ['_id', 'lastUpdate', 'name', 'description', 'vocabulary', 'autoVocabulary'])
    .exec(function(err, query) {
      res.json({"data": query});
    });
};

exports.update = function(req, res, next) {
  if (req.user.writeProtected) {
    logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be updated since it is write protected`);
    res.status(400).json({"error": 'Query cannot be updated since the user is write protected'});
  } else {
    var body = req.body;
    try {
      var vals = Query.computeAutomaticFormalization(body.content, body.goal);
      body.autoAssumptions = vals[0]
      body.autoGoal = vals[1]
      body.lastUpdate = new Date();
      Query.updateOne({ '_id': req.params.queryId, user: req.user._id }, { $set: body}, function (err, result) {
        if (!err && (result.nModified > 0)) {
          logger.info(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} updated`);
          res.status(200).json({"message": 'Query updated'});
        } else if ((result && result.nModified < 1) || (err && err.name == 'CastError')) {
          Query.findById(req.params.queryId, ['writeProtected'], function (err, query) {
            if (query && query.writeProtected) {
              logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be updated since it is write protected`);
              res.status(400).json({"error": 'Query cannot be updated since it is write protected'});
            } else {
              logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be updated since it cannot be found`);
              res.status(404).json({'error': 'Query could not be found'});
            }
          });
        } else {
          logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be updated: ${err}`);
          res.status(400).json({'error': err});
        }
      });
    } catch (error) {
          logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be updated: ${error}`);
      res.status(400).json(error);
    }
  }
};

exports.delete = function(req, res, next) {
  if (req.user.writeProtected) {
    logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be deleted since it is write protected`);
    res.status(400).json({"error": 'Query cannot be deleted since the user is write protected'});
  } else {
    Query.deleteOne({ '_id': req.params.queryId, user: req.user._id }, function (err, result) {
      if (!err && (result.n > 0)) {
        logger.info(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} deleted`);
        res.status(200).json({"message": 'Query deleted'});
      } else if ((result && result.nModified < 1) || (err && err.name == 'CastError')) {
        logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be deleted since it cannot be found`);
        res.status(404).json({'error': 'Query could not be found'});
      } else {
        logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be deleted: ${err}`);
        res.status(400).json({'error': err});
      }
    });
  }
};

// Execute query.
exports.exec = function(req, res) {
  Query.findOne({"_id": req.params.queryId})
    .populate('theory')
    .exec(function(err, query) {
      if (query) {
        query.execQuery(function(theorem, proof) {
          if (theorem) {
            logger.info(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} is a ${theorem}`);
            res.json({"data": {"result":theorem, "proof":proof}});
          } else if (proof) {
            logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be executed: ${proof}`);
            res.status(400).json({'error': proof});
          } else {
            logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be executed since it is invalid`);
            res.status(400).json({'error': 'MleanCoP error: invalid query'});
          }
        });
      } else {
        logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be executed since it cannot be found`);
        res.status(400).json({'error': 'Unknown query ID'});
      }
  });
};

exports.consistency = function(req, res, next) {
  Query.findById(req.params.queryId)
    .populate('theory')
    .exec(function(err, query) {
    if (query) {
      query.isConsistent(function(code, cons) {
        if (code == 1) { // mleancop ok
          if (cons) {
            logger.info(`The assumptions of query ${req.params.queryId} of user ${JSON.stringify(req.user)} are consistent`);
            res.status(200).json({data: {"consistent": true}});
          } else {
            logger.info(`The assumptions of query ${req.params.queryId} of user ${JSON.stringify(req.user)} are not consistent`);
            res.status(200).json({data: {"consistent": false}});
          }
        } else { //mleancop error
          logger.error(`The assumptions of query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be checked for consistency: ${cons}`);
          res.status(400).json({err: cons});
        }
      })
    } else {
      logger.error(`The assumptions of query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be checked for consistency since the query cannot be found`);
      res.status(404).json({err: "Cannot find query"});
    }
    });
};
