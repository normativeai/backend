var Theory = require('../models/theory');
var User= require('../models/user');
var logger = require('../config/winston');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.create = [
  body('name', 'Theory name required').isLength({ min: 1 }).trim(),
  sanitizeBody('name').trim().escape(),

  function(req, res, next) {
    if (req.user.writeProtected) {
      logger.error(`Theory of user ${JSON.stringify(req.user)} cannot be created since the user is write protected`);
      res.status(400).json({"error": 'Theory cannot be created since the user is write protected'});
    } else {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
          logger.error(`Theory of user ${JSON.stringify(req.user)} cannot be created: ${errors.array()}`);
          return res.status(422).json({ errors: errors.array() });
      }

        Theory.create({
          _id: req.body._id,
          name: req.body.name,
          lastUpdate: new Date(),
          user: req.user,
          description: req.body.description,
          content: req.body.content,
          vocabulary: req.body.vocabulary,
          formalization: req.body.formalization,
          creator: req.body.creator
        }).then(theory => {
          User.findById(req.user._id, function(err, user) {
            user.theories.push(theory._id);
            user.save(err => {
              if (err) {
                logger.error(`Theory of user ${JSON.stringify(req.user)} cannot be created: ${err}`);
                res.status(400).json({err: err});
              } else {
                logger.info(`Theory of user ${JSON.stringify(req.user)} created successfully: ${theory}`);
                res.status(201).json({data: theory});
              }
          })})}).catch(function(error) {
            logger.error(`Theory of user ${JSON.stringify(req.user)} cannot be created: ${error}`);
            res.status(400).json(error);
          });
    }
  }
]

exports.get = function(req, res, next) {
  Theory.find({ "user": req.user }, ['_id','name','lastUpdate','description'], {"sort": {"_id": 1}}, function (err, theories) {
    res.json({data: theories})
  });
};

exports.getOne = function(req, res, next) {
  Theory.findById(req.params.theoryId, ['_id','name','lastUpdate','description','formalization','autoFormalization', 'content','vocabulary', 'autoVocabulary'], function (err, theory) {
    res.json({data: theory})
  });
};

exports.update = function(req, res, next) {
  if (req.user.writeProtected) {
    logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be updated since it is write protected`);
    res.status(400).json({"error": 'Theory cannot be updated since the user is write protected'});
  } else {
    var body = req.body;
    body.lastUpdate = new Date();
    try {
      body.autoFormalization = Theory.computeAutomaticFormalization(body.content)
      body.autoVocabulary = Theory.computeAutomaticVocabulary(body.autoFormalization.map(x => x.json))
      Theory.updateOne({ '_id': req.params.theoryId, user: req.user._id }, { $set: body}, function (err, result) {
        if (!err && (result.nModified > 0)) {
          logger.info(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} updated`);
          res.status(200).json({message: 'Theory updated'});
        } else if ((result && result.nModified < 1) || (err && err.name == 'CastError')) {
          Theory.findById(req.params.theoryId, ['writeProtected'], function (err, theory) {
            if (theory && theory.writeProtected) {
              logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)}  cannot be updated since it is write protected`);
              res.status(400).json({"error": 'Theory cannot be updated since it is write protected'});
            } else {
              logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be updated since it cannot be found`);
              res.status(404).json({error: 'Theory could not be found'});
            }
          });

        } else {
          logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be updated: ${err}`);
          res.status(400).json({error: err});
        }
      });
    } catch (error) {
      logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be updated: ${error}`);
      res.status(400).json(error);
    }
  }
};

exports.delete = function(req, res, next) {
  if (req.user.writeProtected) {
    logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be deleted since it is write protected`);
    res.status(400).json({"error": 'Theory cannot be deleted since the user is write protected'});
  } else {
    Theory.deleteOne({ '_id': req.params.theoryId, user: req.user._id }, function (err, result) {
      if (!err && (result.n > 0)) {
        res.status(200).json({message: 'Theory deleted'});
        logger.info(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} deleted`);
      } else if ((result && result.nModified < 1) || (err && err.name == 'CastError')) {
        logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be deleted since it was not found`);
        res.status(404).json({error: 'Theory could not be found'});
      } else {
        logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be deleted: ${err}`);
        res.status(400).json({error: err});
      }
    });
  }
};

exports.find = function(req, res, next) {
  var query = req.query.query;
  var search = {$or:[{name:{$regex: query, $options: 'i'}},{description:{$regex: query, $options: 'i'}}]}
  Theory.find(search, ['_id','name','lastUpdate','description'], {"sort": {"_id": 1}}, function (err, theories) {
    res.json({data: theories})
  });
};

exports.clone = function(req, res, next) {
  if (req.user.writeProtected) {
    logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be cloned since it is write protected`);
    res.status(400).json({"error": 'Theory cannot be cloned since the user is write protected'});
  } else {
    Theory.findById(req.params.theoryId, function (err, theory) {
      theory.user = req.user._id;
      theory.clonedForm = theory._id;
      theory._id = undefined;
      theory.name = theory.name + " (Clone)";
      theory.isNew = true;
      theory.save(function (err, theory) {
        if (err) {
          logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be cloned: ${err}`);
          res.status(400).json({error: `Could not clone: ${err}`})
        } else {
          User.findById(req.user._id, function(err, user) {
            user.theories.push(theory._id);
            user.save(err => {
              if (err) {
                logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be cloned: ${err}`);
                res.status(400).json({error: err});
              } else {
                logger.info(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cloned`);
                res.status(201).json({data: {theory: {_id: theory._id}}});
              }})})}});
    });
  }
};

exports.consistency = function(req, res, next) {
  Theory.findById(req.params.theoryId, function (err, theory) {
    if (theory) {
      theory.isConsistent(function(code, cons) {
        if (code == 1) { // mleancop ok
          if (cons) {
            logger.info(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} is consistent`);
            res.status(200).json({data: {"consistent": true}});
          } else {
            logger.info(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} is not consistent`);
            res.status(200).json({data: {"consistent": false}});
          }
        } else { //mleancop error
          logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be checked for consistency ${cons}`);
          res.status(400).json({error: cons});
        }
      })
    } else {
      logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be checked for consistency since it cannot be found`);
      res.status(404).json({err: "Cannot find theory"});
    }
    });
};

exports.independent = function(req, res, next) {
  Theory.findById(req.params.theoryId, function (err, theory) {
    if (theory) {
      logger.info(`Checking theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} for independency of ${req.params.formId}`);
      logger.info(theory.getFormalization())
      theory.isIndependent(req.params.formId, function(code, cons) {
        if (code == 1) { // mleancop ok
          if (cons) {
            logger.info(`Norm ${req.params.formId} of theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} is independent`);
            res.status(200).json({data: {"independent": true}});
          } else {
            logger.info(`Norm ${req.params.formId} of theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} is not independent`);
            res.status(200).json({data: {"independent": false}});
          }
        } else { //mleancop error
          logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be checked for independency: ${cons}`);
          res.status(400).json({error: cons});
        }
      })
    } else {
      logger.error(`Theory ${req.params.theoryId} of user ${JSON.stringify(req.user)} cannot be checked for independency since it cannot be found`);
      res.status(404).json({error: "Cannot find theory"});
    }
    });
};
