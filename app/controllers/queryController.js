var Query = require('../models/query');

// Execute query.
exports.exec = function(req, res) {
  //Query.create({ name: 'Q1', content: "([un, t , (~ c1), c2], (Ob d2))"}, function (err, small) {
  //if (err) return handleError(err);
    // saved!
  //});
  //var query = Query.findById(req.params.id);
  Query.findOne({"name": "Q1"}, function(err, query) {
    console.log(query.name);
    query.execQuery(function() {
      res.send('Success!');
    });
  });
};
