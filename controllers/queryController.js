var Query = require('../models/query');
var Theory = require('../models/theory');
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
      try {
        var vals = Query.computeAutomaticFormalization(body.content, body.goal);
        var voc = (vals[1].json) ? // the auto goal contains an auto goal and not something else, like a normal goal
           Theory.computeAutomaticVocabulary(vals[0].map(x => x.json).concat([vals[1].json.goal.formula]))
           :
           Theory.computeAutomaticVocabulary(vals[0].map(x => x.json))

        Query.create({
          _id: req.body._id,
          name: req.body.name,
          lastUpdate: new Date(),
          user: req.user,
          theory: req.body.theory,
          description: req.body.description,
          assumptions: req.body.assumptions,
          content: req.body.content,
          goal: req.body.goal,
          autoGoal: vals[1],
          autoAssumptions: vals[0],
          autoVocabulary: voc
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
      } catch (error) {
        logger.error(`Query of user ${JSON.stringify(req.user)} cannot be created: ${error}`);
        res.status(400).json(error);
      }
    }
  }
]

exports.get = function(req, res, next) {
  Query.find({ "user": req.user }, ['_id', 'lastUpdate', 'name', 'description'], {"sort": {"_id": 1}}, function (err, queries) {
    res.json({"data": queries})
  });
};

exports.getOne = function(req, res, next) {
  Query.findById(req.params.queryId, ['_id', 'lastUpdate', 'name', 'description', 'content', 'assumptions', 'autoAssumptions', 'goal', 'autoGoal', 'autoVocabulary'])
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
      if (body.autoGoal.json) { // the auto goal contains an auto goal and not something else, like a normal goal
        body.autoVocabulary = Theory.computeAutomaticVocabulary(body.autoAssumptions.map(x => x.json).concat([body.autoGoal.json.goal.formula]))
      } else {
        body.autoVocabulary = Theory.computeAutomaticVocabulary(body.autoAssumptions.map(x => x.json))
      }
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
        query.execQuery(function(code, theorem, proof) {
          if (code == 1) { //mleancop ok
            if (theorem) {
              logger.info(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} is a ${theorem}`);
              if (theorem == "Theorem") {
                res.status(200).json({message: "The query is valid. The goal logically follows from the assumptions and legislation", type: "success", proof: proof});
              } else {
                res.status(200).json({message: "The query is counter-satisfiable. The goal does not logically follow from the assumptions and legislation", type: "info"});
              }
            } else if (proof) {
              logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be executed: ${proof}`);
              res.status(400).json({'error': proof});
            } else {
              logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be executed since it is invalid`);
              res.status(400).json({'error': 'MleanCoP error: invalid query'});
            }
          } else if (code == 2) { //timeout
            logger.info(`Goal of query ${req.params.queryId} of user ${JSON.stringify(req.user)} probably follows from assumptions and legislation`);
            res.status(206).json({message: 'Backend prover could not resolve the validity of the query. This normally means (but not always) that the goal does not follow from the assumptions and legislation!', type: 'warning'});
          } else {
            logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be executed: ${proof}`);
            res.status(400).json({'error': proof});
          }
        });
      } else {
        logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be executed since it cannot be found`);
        res.status(400).json({'error': 'Unknown query ID'});
      }
  });
};

// Looking for counter models.
exports.cmodel = function(req, res) {
  Query.findOne({"_id": req.params.queryId})
    .populate('theory')
    .exec(function(err, query) {
      if (query) {
        query.findCModels(function(code, theorem, proof) {
          if (code == 1) { // engine ok
            if (theorem) {
              logger.info(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} is a ${theorem}`);
              if (theorem == "Theorem") {
                res.status(200).json({message: "The query is valid. The goal logically follows from the assumptions and legislation and therefore no counter-model exists", type: "info"});
              } else {
                res.status(200).json({message: "The query is counter-satisfiable. The following is one counter model", type: "success", cmodel: proof});
              }
            } else if (proof) {
              logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be checked for counter models: ${proof}`);
              res.status(400).json({'error': proof});
            } else {
              logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be checked for counter models since it is invalid`);
              res.status(400).json({'error': 'MleanCoP error: invalid query'});
            }
          } else if (code == 2) { //timeout
            logger.info(`Goal of query ${req.params.queryId} of user ${JSON.stringify(req.user)} was timeoutted `);
            res.status(206).json({message: 'Backend prover ran out of time to find counter models.', type: 'warning'});
          } else {
            logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be looked for counter models: ${proof}`);
            res.status(400).json({'error': proof});
          }
        });
      } else {
        logger.error(`Query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be looked for counter models since it cannot be found`);
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
            res.status(200).json({message: "The assumptions of the query together with the legislation are consistent", type: "success"});
          } else {
            logger.info(`The assumptions of query ${req.params.queryId} of user ${JSON.stringify(req.user)} are not consistent`);
            res.status(200).json({message: "The assumptions of the query together with the legislation are not consistent", type: "info"});
          }
        } else if (code == 2) { //timeout
            logger.info(`Assumptions of query ${req.params.queryId} of user ${JSON.stringify(req.user)} are probably consistent`);
            res.status(206).json({message: 'Backend prover could not resolve the consistency of the assumptions. This normally means (but not always) that the assumptions are consistent!', type: 'warning'});
        } else { //mleancop error
          logger.error(`The assumptions of query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be checked for consistency: ${cons}`);
          res.status(400).json({err: cons});
        }
      })
    } else {
      logger.error(`The assumptions of query ${req.params.queryId} of user ${JSON.stringify(req.user)} cannot be checked for consistency since the query cannot be found`);
      res.status(404).json({error: "Cannot find query"});
    }
    });
};
