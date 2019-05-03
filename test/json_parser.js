var assert = require('assert')

var parser = require('../models/jsonParser')

const pairs = [
  [{
    text: "A contract shall be governed by the law chosen by the parties.",
    code: "Connector",
    connector: {
      text: "A contract shall be governed by the law chosen by the parties.",
      name: "Obligation Only If",
      connectorCode: "ObOnIf",
      formulas: [
        {
          text: "A contract",
          code: "Term",
          term: "contract(Law, Part)"
        },
        {
          text: "the law chosen by the parties",
          code: "Term",
          term: "valid_choice(Law, Part)"
        }
      ]
    }
   }, '(valid_choice(Law, Part) O> contract(Law, Part))']
];

describe("JSON parser", function(){
  it(`should parse the objects in ${pairs} correctly`, function(done){
    for(var i = 0 ; i < pairs.length; i++) {
      assert.equal(parser.parseFormula(pairs[i][0]), pairs[i][1]);
    }
    done();
  });
})

