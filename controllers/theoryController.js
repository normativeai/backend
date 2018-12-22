var Theory = require('../models/theory');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.create = [
  body('name', 'Genre name required').isLength({ min: 1 }).trim(),
  sanitizeBody('name').trim().escape(),

  function(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    Theory.create({
      name: req.body.name,
      lastUpdate: new Date(),
      user: req.user,
      description: req.body.description,
      content: req.body.content,
      vocabulary: req.body.vocabulary,
      formalization: req.body.formalization,
      creator: req.body.creator
    }).then(theory => res.status(201).json(theory));

  }
]

exports.get = function(req, res, next) {
  Theory.find({ "user": req.user }, ['_id','name','lastUpdate','description'], function (err, theories) {
    res.send(theories)
  });
};

exports.getOne = function(req, res, next) {
  Theory.findById(req.params.theoryId, ['_id','name','lastUpdate','description'], function (err, theory) {
    res.send(theory)
  });
};

exports.update = function(req, res, next) {
  Theory.updateOne({ '_id': req.params.theoryId, user: req.user._id }, { $set: req.body}, function (err, result) {
    if (!err && (result.nModified > 0)) {
      res.status(200).send('Theory updated');
    } else if (err.name = 'CastError' || result.nModified < 1) {
      res.status(404).send('Theory could not be found');
    } else {
      res.status(400).send(`Error: ${err}`);
    }
  });
};

exports.delete= function(req, res, next) {
  Theory.deleteOne({ '_id': req.params.theoryId, user: req.user._id }, function (err, result) {
    if (!err && (result.n > 0)) {
      res.status(200).send('Theory deleted');
    } else if (err.name = 'CastError' || result.n < 1) {
      res.status(404).send('Theory could not be found');
    } else {
      res.status(400).send(`Error: ${err}`);
    }
  });
};
