var Query = require('../models/query');
var User= require('../models/user');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.create = [
  body('name', 'Query name required').isLength({ min: 1 }).trim(),
  sanitizeBody('name').trim().escape(),

  function(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
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
      goal: req.body.goal
    }).then(query => {
      User.findById(req.user._id, function(err, user) {
        user.queries.push(query._id);
        user.save(err => {
          if (err) {
            res.status(400).send(err);
          } else {
            res.status(201).json(query);
          }
      })})});
  }
]



// Execute query.
exports.exec = function(req, res) {
  //Query.create({ name: 'Q1', content: "([un, t , (~ c1), c2], (Ob d2))"}, function (err, small) {
  //if (err) return handleError(err);
    // saved!
  //});
  //var query = Query.findById(req.params.id);
  Query.findOne({"name": req.params.name}, function(err, query) {
    query.execQuery(function(proof) {
      res.send(proof);
    });
  });
};
