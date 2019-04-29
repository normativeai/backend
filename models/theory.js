//Require Mongoose
var logger = require('../config/winston');
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var theorySchema = new Schema({
    lastUpdate        : Date,
    name 		          : String,
    description       : String,
    content           : String,
    vocabulary        : [{symbol: String, original: String}],
    formalization     : [{original: String, formula: String, active: Boolean, lastIndependent: Boolean, lastIndependentDate: Date}],
		user 							: { type: Schema.Types.ObjectId, ref: 'User' },
    clonedForm        : { type: Schema.Types.ObjectId, ref: 'Theory' },
    lastConsistency   : Boolean,
    lastConsistencyDate: Date
});

theorySchema.statics.isActive = function(form) {
  return !('active' in form.toJSON()) || form.toJSON().active;
};

theorySchema.methods.formalizationAsString = function(possibleFurtherAssumtions) {
  if (possibleFurtherAssumtions) {
    return JSON.stringify(this.activeFormalization().map(f => f.formula).concat(possibleFurtherAssumtions)).replace(/\"/g,"");
  } else {
    return JSON.stringify(this.activeFormalization().map(f => f.formula)).replace(/\"/g,"");
  }
};

theorySchema.methods.isConsistent = function(cb) {
  if (typeof this.lastConsistencyDate === 'undefined' || this.lastUpdate > this.lastConsistencyDate) {
    var helper = require('./queryHelper');
    var obj = this
    helper.executeQuery(this.formalization, [], "(x, (~ x))", function(theorem, proof) {
      if (theorem) {
        obj.lastConsistency = (theorem != 'Theorem');
        obj.lastConsistencyDate = new Date();
        obj.save(function (err) {
          logger.error(`Cannot save consistency state. ${err}`);
        });
        cb(1, theorem != 'Theorem');
      } else {
        cb(0, proof);
      }
    });
  } else {
    cb(1, this.lastConsistency);
  }
};

theorySchema.methods.isIndependent = function(id, cb) {
  form = this.formalization.id(id);
  if (typeof form.lastIndependentiDate === 'undefined' || this.lastUpdate > form.lastIndependentDate) {
    forms = this.formalization.slice(0)
    forms.splice(this.formalization.indexOf(form), 1)
    var helper = require('./queryHelper');
    helper.executeQuery(forms, [], form.formula, function(theorem, proof) {
      if (theorem) {
        form.lastIndependent = (theorem != 'Theorem');
        form.lastIndependentDate = new Date();
        form.parent().save(function (err) {
          logger.error(`Cannot save independence state. ${err}`);
        });
        cb(1, theorem != 'Theorem');
      } else {
        cb(0, proof);
      }
    });
  } else {
    cb(1,form.lastIndependent);
  }
};

module.exports = mongoose.model('Theory', theorySchema );
