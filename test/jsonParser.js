var assert = require('assert')
const fs = require('fs');

var parser = require('../models/jsonParser')

let json_rome = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
let json_gdpr = fs.readFileSync("./test/fixtures/gdpr.json", "utf8");

const pairs = [
  ['{"text": "aaa","connective": {"code": "or", "formulas": [{"text": "aaa", "term": {"name": "a"}},{"text": "aaa", "term": {"name": "b"}}, {"text": "aaa", "term": {"name": "c"}}] } }','((a ; b) ; c)'],
  ['{"text": "ccc","connective": {"code": "label", "formulas": [{"text": "ccc", "term": {"name": "index1"}}, {"text": "aaa","connective": {"code": "or", "formulas": [{"text": "aaa", "term": {"name": "a"}},{"text": "aaa", "term": {"name": "b"}}, {"text": "aaa", "term": {"name": "c"}}]}} ] }}','((a ; b) ; c)'],
  [json_rome, '(validChoice(Law,Part) O> contract(Law,Part))'],
];

describe("JSON parser", function(){
  it(`should parse ${pairs[0][0]} correctly`, function(done){
    assert.equal(parser.parseFormula(JSON.parse(pairs[0][0])), pairs[0][1]);
    done();
  });
  it(`should parse ${pairs[1][0]} correctly`, function(done){
    let state = new Map()
    assert.equal(parser.parseFormula(JSON.parse(pairs[1][0]), state), pairs[1][1]);
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

