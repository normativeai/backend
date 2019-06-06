//Require Mongoose
var logger = require('../config/winston');
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var querySchema = new Schema({
    lastUpdate        : Date,
    name 		          : String,
    assumptions       : [String],
    content           : String, // annotated XML
    autoAssumptions   : [{original: String, json: Object, formula: String}],
    autoGoal          : {original: String, json: Object, formula: String},
    goal              : String,
    description       : String,
		cached_result			: String,
		theory						: { type: Schema.Types.ObjectId, ref: 'Theory' },
		user 							: { type: Schema.Types.ObjectId, ref: 'User' },
    lastQueryDate     : Date,
    lastQueryTheorem  : String,
    lastQueryProof    : String,
    lastConsistencyDate : Date,
    lastConsistency   : Boolean,
    writeProtected    : Boolean
});

// this is static since update pre hooks are problematic so we call it from the controller and the doc is not read yet
querySchema.statics.computeAutomaticFormalization = function (content) {
  if (content != null) {
    var xmlParser = require('./xmlParser');
    var jsonParser = require('./jsonParser');
    var ret = xmlParser.parse(content).map(function(obj) {
      var form = jsonParser.parseFormula(obj)
       return {
        original: obj.text,
        json: obj,
        formula: form
      }
    })
    //logger.info(`Converted content ${content} into formalization ${JSON.stringify(ret)}.`);
    var index = ret.findIndex(function(x) { return x.json.hasOwnProperty('goal')})
    if (index < 0) {
      // no goal
      return [ret,{}]
    } else if (ret.length == 1) {
      // only goal
      var goal = ret[index]
      return [[],goal]
    } else {
      var goal = ret[index]
      return [ret.splice(index-1,1),goal]
    }
  } else {
    return []
  }
}


// we call only on save/create and not on update since the update hook doest have access to the document and methods
querySchema.pre('save', function(next) {
  // we generate the automatic formalization as well
  try {
    var res = querySchema.statics.computeAutomaticFormalization(this.content)
    this.autoAssumptions = res[0]
    this.autoGoal = res[1]
    next()
  } catch (error) {
    next(error)
  }
})


querySchema.pre('updateOne', function(next) {
    this.updateOne({$or: [{writeProtected: {$exists: false}}, {writeProtected: false}] },{});
    next()
});

querySchema.methods.execQuery = function(cb) {
  if (typeof this.lastQueryDate === 'undefined' || this.lastUpdate > this.lastQueryDate) {
    var helper = require('./queryHelper');

    if (!!!this.theory) {
      cb(false, 'Query is not associated with a specific theory. Please set the theory before trying to execute queries');
    } else if (!this.goal && !this.autoGoal.formula) {
      cb(false, 'Query has no goal. Please assign goals before trying to execute queries');
    } else {
      var obj = this
      if (!this.autoGoal.formula) {
        this.autoGoal.formula = this.goal
      }
      helper.executeQuery(this.theory.getFormalization(), this.assumptions.concat(this.autoAssumptions.map(x => x.formula)), this.autoGoal.formula, function(theorem, proof) {
        obj.lastQueryTheorem = theorem;
        obj.lastQueryProof = proof;
        obj.lastQueryDate = new Date();
        obj.save(function (err) {
          if (err)
            logger.error(`Cannot save query state. ${err}`);
        });
        cb(theorem, proof);
      });
    }
  } else {
    cb(this.lastQueryTheorem, this.lastQueryProof);
  }
};

querySchema.methods.isConsistent = function(cb) {
  if (typeof this.lastConsistencyDate === 'undefined' || this.lastUpdate > this.lastConsistencyDate) {
    var helper = require('./queryHelper');

    if (!!!this.theory) {
      cb(false, 'Query is not associated with a specific theory. Please set the theory before trying to check for consistency');
    } else {
      var obj = this
      helper.executeQuery(this.theory.getFormalization(), this.assumptions, "(x, (~ x))", function(theorem, proof) {
        if (theorem) {
        obj.lastConsistency = (theorem != 'Theorem');
        obj.lastConsistencyDate = new Date();
        obj.save(function (err) {
          if (err)
            logger.error(`Cannot save consistency state. ${err}`);
        });
          cb(1, theorem != 'Theorem');
        } else {
          cb(0, proof);
        }
      });
    }
  } else {
    cb(1, this.lastConsistency);
  }
};


module.exports = mongoose.model('Query', querySchema );
