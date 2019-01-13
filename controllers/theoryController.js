var Theory = require('../models/theory');
var User= require('../models/user');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.create = [
  body('name', 'Theory name required').isLength({ min: 1 }).trim(),
  sanitizeBody('name').trim().escape(),

  function(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
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
            res.status(400).send(err);
          } else {
            res.status(201).json(theory);
          }
      })})});
  }
]

exports.get = function(req, res, next) {
  Theory.find({ "user": req.user }, ['_id','name','lastUpdate','description'], {"sort": {"_id": 1}}, function (err, theories) {
    res.send(theories)
  });
};

exports.getOne = function(req, res, next) {
  Theory.findById(req.params.theoryId, ['_id','name','lastUpdate','description','formalization','content','vocabulary'], function (err, theory) {
    res.send(theory)
  });
};

exports.update = function(req, res, next) {
  var body = req.body;
  body.lastUpdate = new Date();
  Theory.updateOne({ '_id': req.params.theoryId, user: req.user._id }, { $set: body}, function (err, result) {
    if (!err && (result.nModified > 0)) {
      res.status(200).send('Theory updated');
    } else if ((result && result.nModified < 1) || (err && err.name == 'CastError')) {
      res.status(404).send('Theory could not be found');
    } else {
      res.status(400).send(`Error: ${err}`);
    }
  });
};

exports.delete = function(req, res, next) {
  Theory.deleteOne({ '_id': req.params.theoryId, user: req.user._id }, function (err, result) {
    if (!err && (result.n > 0)) {
      res.status(200).send('Theory deleted');
    } else if ((result && result.nModified < 1) || (err && err.name == 'CastError')) {
      res.status(404).send('Theory could not be found');
    } else {
      res.status(400).send(`Error: ${err}`);
    }
  });
};

exports.find = function(req, res, next) {
  var query = req.query.query;
  var search = {$or:[{name:{$regex: query, $options: 'i'}},{description:{$regex: query, $options: 'i'}}]}
  Theory.find(search, ['_id','name','lastUpdate','description'], {"sort": {"_id": 1}}, function (err, theories) {
    res.send(theories)
  });
};

exports.clone = function(req, res, next) {
  Theory.findById(req.params.theoryId, function (err, theory) {
    theory.user = req.user._id;
    theory.clonedForm = theory._id;
    theory._id = undefined;
    theory.isNew = true;
    theory.save(function (err, theory) {
      if (err) {
        res.status(400).send(`Could not clone: ${err}`)
      } else {
        User.findById(req.user._id, function(err, user) {
          user.theories.push(theory._id);
          user.save(err => {
            if (err) {
              res.status(400).send(err);
            } else {
              res.status(201).json({theory: {_id: theory._id}});
            }})})}});
  });
};

exports.consistency = function(req, res, next) {
  Theory.findById(req.params.theoryId, function (err, theory) {
    if (theory) {
      theory.isConsistent(function(code, cons) {
        if (code == 1) { // mleancop ok
          if (cons) {
            res.status(200).json({"consistent": "true"});
          } else {
            res.status(200).json({"consistent": "false"});
          }
        } else { //mleancop error
          res.status(400).send('MleanCoP error: invalid formula');
        }
      })
    } else {
      res.status(404).send("Cannot find theory");
    }
    });
};
