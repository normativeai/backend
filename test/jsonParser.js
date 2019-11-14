var assert = require('assert')
const fs = require('fs');

var parser = require('../models/jsonParser')

let json_rome = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
let json_gdpr = fs.readFileSync("./test/fixtures/gdpr.json", "utf8");

const pairs = [
  ['{"text": "aaa","connective": {"code": "or", "formulas": [{"text": "aaa", "term": {"name": "a"}},{"text": "aaa", "term": {"name": "b"}}, {"text": "aaa", "term": {"name": "c"}}] } }','((a ; b) ; c)'],
  ['{"text": "ddd","connective": {"code": "label", "formulas": [{"text": "ccc", "term": {"name": "index1"}}, {"text": "aaa","connective": {"code": "or", "formulas": [{"text": "aaa", "term": {"name": "a"}},{"text": "aaa", "term": {"name": "b"}}, {"text": "aaa", "term": {"name": "c"}}]}} ] }}','((a ; b) ; c)'],
  [json_rome, '(validChoice(Law,Part) O> contract(Law,Part))'],
];

threePasses = function(jsons) {
  let state = new Map();
  jsons.forEach(json => parser.parseFormula(json,{pass: 1, map: state})) // pass 1
  jsons.forEach(json => parser.parseFormula(json,{pass: 2, map: state})) // pass 2
  return jsons.map(function(json) {
    return parser.parseFormula(json,{pass: 3, map: state})
  }).filter(el => el != null)
}

describe("JSON parser", function(){
  it(`should parse ${pairs[0][0]} correctly`, function(done){
    assert.equal(parser.parseFormula(JSON.parse(pairs[0][0])), pairs[0][1]);
    done();
  });
  it(`should parse ${pairs[2][0]} correctly`, function(done){
    assert.equal(parser.parseFormula(JSON.parse(pairs[2][0])), pairs[2][1]);
    done();
  });
  it("should parse correctly the GDPR JSON", function(done) {
    assert.equal(parser.parseFormula(JSON.parse(json_gdpr)), "(((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) O> communicate_at_time(Y,W,T,contact_details(Y))) , (((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) , representative(K,Y)) O> communicate_at_time(Y,W,T,contact_details(K))))");
    done();
  });
})

describe("Three passes JSON parser", function() {
  it(`should parse labels correctly`, function(done){
    assert.equal(threePasses([JSON.parse(pairs[1][0])]), pairs[1][1]);
    done();
  });
  it("should parse correctly labels and exceptions", function(done) {
    let label = {
      text: "label1",
      connective: {
        code: "label",
        formulas: [
          {
            text: "label1",
            term: {
              name: "label1"
            }
          },
          {
            text: "aaa",
            term: {
              name: "statement"
            }
          }
        ]
      }
    }
    let exception = {
      text: "exception",
      connective: {
        code: "exception",
        formulas: [
          {
            text: "label1",
            term: {
              name: "label1"
            }
          },
          {
            text: "bbb",
            term: {
              name: "cond"
            }
          }
        ]
      }
    }
    assert.equal(threePasses([label,exception]), "((~ cond) => statement)");
    done();
  });
  it("should parse correctly labels and exceptions over macros", function(done) {
    let label = {
      text: "label1",
      connective: {
        code: "label",
        formulas: [
          {
            text: "label1",
            term: {
              name: "label1"
            }
          },
          JSON.parse(json_gdpr)
        ]
      }
    }
    let exception = {
      text: "exception",
      connective: {
        code: "exception",
        formulas: [
          {
            text: "label1",
            term: {
              name: "label1"
            }
          },
          {
            text: "bbb",
            term: {
              name: "cond"
            }
          }
        ]
      }
    }
    assert.equal(threePasses([label,exception]), "((((~ cond) , (((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z))) O> communicate_at_time(Y,W,T,contact_details(Y))) , ((((~ cond) , (((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z))) , representative(K,Y)) O> communicate_at_time(Y,W,T,contact_details(K))))");
    done();
  });

})

