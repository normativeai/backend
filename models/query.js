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
    autoVocabulary    : [{symbol: String, original: String, full: String}],
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
// It uses goal in case there is no automatic goal
querySchema.statics.computeAutomaticFormalization = function (content, goal) {
  if (content != null) {
    var xmlParser = require('./xmlParser');
    var jsonParser = require('./jsonParser');
    logger.info(`Parsing html: ${content}`);
    var ret = xmlParser.parse(content).map(function(obj) {
      logger.info(`Parsing json: ${JSON.stringify(obj)}`);
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
      return [ret,{"formula": goal}]
    } else if (ret.length == 1) {
      // only goal
      var agoal = ret[index]
      return [[],agoal]
    } else {
      var agoal = ret[index]
      ret.splice(index,1)
      return [ret,agoal]
    }
  } else {
    return [[], {"formula": goal}]
  }
}


// we call only on save/create and not on update since the update hook doest have access to the document and methods
querySchema.pre('save', function(next) {
  // we generate the automatic formalization as well
  try {
    var res = querySchema.statics.computeAutomaticFormalization(this.content, this.goal)
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
  if (typeof this.lastQueryDate === 'undefined' || this.lastUpdate > this.lastQueryDate || this.theory.lastUpdate > this.lastQueryDate) {
    var helper = require('./queryHelper');
    if (!!!this.theory) {
      cb(0, false, 'Query is not associated with a specific theory. Please set the theory before trying to execute queries');
    } else if (!this.goal && !this.autoGoal.formula) {
      cb(0, false, 'Query has no goal. Please assign goals before trying to execute queries');
    } else {
      var obj = this
      if (!this.autoGoal.formula) {
        this.autoGoal.formula = this.goal
      }

      var addAssump = [] // additional assumptions based on theory
      if (this.theory.name.match(/GDPR/i)) {
        // GDPR related assumptions
        addAssump = ["controller(controller,data)","nominate(controller,processor)","processor(processor)","personal_data_processed(processor, data, time_x, justification, purpose)","personal_data(data,subject)","data_subject(subject)","collected_at(data,time_y)","controller(controller,data)","nominate(controller, processor_2)","processor(processor_2)","personal_data_processed(processor_2, data, time_z, justification_2, purpose_2)","earlier(time_z,time_x)","different_from(purpose, purpose_2)","((((Pm communicate_before_time(Controllerlog1, Subjectlog1, Zlog1, Actionlog1)) , earlier(Ylog1, Zlog1)) , earlier(Xlog1, Ylog1)) => (Pm communicate_within_time(Xlog1,Controllerlog1, Subjectlog1, Ylog1, Actionlog1)))"]
      }

      helper.executeQuery(this.theory.getFormalization(), this.assumptions.concat(this.autoAssumptions.map(x => x.formula)).concat(addAssump), this.autoGoal.formula, function(theorem, proof, additionalCode) {
        if (theorem) {
          obj.lastQueryTheorem = theorem;
          obj.lastQueryProof = proof;
          obj.lastQueryDate = new Date();
          obj.save(function (err) {
            if (err)
              logger.error(`Cannot save query state. ${err}`);
          });
          cb(1, theorem, proof);
        } else {
          cb(additionalCode, theorem, proof);
        }
      });
    }
  } else {
    cb(1, this.lastQueryTheorem, this.lastQueryProof);
  }
};

querySchema.methods.isConsistent = function(cb) {
  if (typeof this.lastConsistencyDate === 'undefined' || this.lastUpdate > this.lastConsistencyDate || this.theory.lastUpdate > this.lastConsistencyDate ) {
    var helper = require('./queryHelper');

    if (!!!this.theory) {
      cb(false, 'Query is not associated with a specific theory. Please set the theory before trying to check for consistency');
    } else {
      var obj = this
      helper.executeQuery(this.theory.getFormalization(), this.assumptions.concat(this.autoAssumptions.map(x => x.formula)), "(x, (~ x))", function(theorem, proof, additionalCode) {
        if (theorem) {
          obj.lastConsistency = (theorem != 'Theorem');
          obj.lastConsistencyDate = new Date();
          obj.save(function (err) {
            if (err)
              logger.error(`Cannot save consistency state. ${err}`);
          });
          cb(1, theorem != 'Theorem');
        } else {
          cb(additionalCode, proof);
        }
      });
    }
  } else {
    cb(1, this.lastConsistency);
  }
};


module.exports = mongoose.model('Query', querySchema );
