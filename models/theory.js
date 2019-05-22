//Require Mongoose
var logger = require('../config/winston');
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var theorySchema = new Schema({
    lastUpdate        : Date,
    name 		          : String,
    description       : String,
    content           : String, // annotated XML
    vocabulary        : [{symbol: String, original: String}],
    formalization     : [{original: String, json: Object, formula: String, active: Boolean, lastIndependent: Boolean, lastIndependentDate: Date}],
    autoFormalization : [{original: String, json: Object, formula: String, active: Boolean, lastIndependent: Boolean, lastIndependentDate: Date}],
		user 							: { type: Schema.Types.ObjectId, ref: 'User' },
    clonedForm        : { type: Schema.Types.ObjectId, ref: 'Theory' },
    lastConsistency   : Boolean,
    lastConsistencyDate: Date
});


theorySchema.methods.getFormalization = function() {
  return this.formalization.concat(this.autoFormalization)
}

// TODO add objects to the formalization to store the json objects. We also need to store the generated formulas
// Maybe original will be the text?

// this is static since update pre hooks are problematic
theorySchema.statics.computeAutomaticFormalization = function (content) {
  if (content != null && content.includes("html")) {
    var xmlParser = require('./xmlParser');
    var jsonParser = require('./jsonParser');
    return xmlParser.parse(content).map(function(obj) {
       return {
        original: obj.text,
        json: obj,
        formula: jsonParser.parseFormula(obj)
      }
    })
  } else {
    return []
  }
}

// we call only on save/create and not on update since the update hook doest have access to the document and methods
theorySchema.pre('save', function(next) {
  // we generate the automatic formalization as well
  try {
    this.autoFormalization = theorySchema.statics.computeAutomaticFormalization(this.content)
    next()
  } catch (error) {
    next(error)
  }
})

theorySchema.statics.isActive = function(form) {
  return !('active' in form.toJSON()) || form.toJSON().active;
};

  theorySchema.methods.isConsistent = function(cb) {
    if (typeof this.lastConsistencyDate === 'undefined' || this.lastUpdate > this.lastConsistencyDate) {
      var helper = require('./queryHelper');
      var obj = this
      helper.executeQuery(this.getFormalization(), [], "(x, (~ x))", function(theorem, proof) {
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
  forms = this.getFormalization();
  form = forms.find(f => f._id == id);
  if (typeof form.lastIndependentDate === 'undefined' || this.lastUpdate > form.lastIndependentDate) {
    forms = forms.slice(0)
    forms.splice(forms.indexOf(form), 1)
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
