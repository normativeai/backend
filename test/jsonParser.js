var assert = require('assert')
const fs = require('fs');

var parser = require('../models/jsonParser')

let json_rome = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
let json_gdpr = fs.readFileSync("./test/fixtures/gdpr.json", "utf8");

const pairs = [
  ['{"text": "aaa","connective": {"code": "or", "formulas": [{"text": "aaa", "term": {"name": "a"}},{"text": "aaa", "term": {"name": "b"}}, {"text": "aaa", "term": {"name": "c"}}] } }','((a ; b) ; c)'],
  [json_rome, '(validChoice(Law,Part) O> contract(Law,Part))'],
];

describe("JSON parser", function(){
  it(`should parse the objects in ${pairs} correctly`, function(done){
    for(var i = 0 ; i < pairs.length; i++) {
      assert.equal(parser.parseFormula(JSON.parse(pairs[i][0])), pairs[i][1]);
    }
    done();
  });

  it("should parse correctly the GDPR JSON", function(done) {
    let obs = parser.parseFormula(JSON.parse(json_gdpr))
    assert.equal(obs.length, 2);
    assert.equal(obs[0], "((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) O> communicate_at_time(Y,W,T,contact_details(Y)))");
    assert.equal(obs[1], "(((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) , representative(K,Y)) O> communicate_at_time(Y,W,T,contact_details(K)))");
    done();
  });
})

