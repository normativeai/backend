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
      user: req.session.passport.user,
      description: req.body.description,
      content: req.body.content,
      vocabulary: req.body.vocabulary,
      formalization: req.body.formalization,
      creator: req.body.creator
    }).then(theory => res.json(theory));

  }
]

exports.get = function(req, res, next) {
  Theory.find({ "user": req.session.passport.user }, ['_id','name','lastUpdate','description'], function (err, theories) {
    res.send(theories)
  });
};

exports.getOne = function(req, res, next) {
  Theory.findById(req.params.theoryId, ['_id','name','lastUpdate','description'], function (err, theory) {
    res.send(theory)
  });
};

exports.update = function(req, res, next) {
  Theory.update({ _id: id, "user": req.session.passport.user }, { $set: req.body}, function (err, theory) {
    if (!err & theory) {
      res.status(200)
    } else {
      res.status(400)
    }
  });
};
