exports.connectives = function(req, res, next) {
  var xmlParser = require('../models/xmlParser')
  var jsonParser = require('../models/jsonParser')
  var ops = xmlParser.ops
  var arities = jsonParser.arities
  var ret = Object.keys(ops).reduce(function(obj, key) {
    var arityCode = arities(key)
    var arity = 0
    if (arityCode == 2)
      arity = 'Two'
    else if (arityCode == 1)
      arity = 'One'
    else if (arityCode == -1)
      arity = 'Two or more'
    else
      throw `Unknown arity of operator ${key}`
    obj[key] = {'code': key, 'name': ops[key], 'arity': arity}
    return obj
  }, {})
  res.json({"data": ret})
};
