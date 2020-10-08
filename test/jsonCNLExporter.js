var assert = require('assert')
const fs = require('fs');
const chai = require('chai');
const { expect } = chai;

var exporter = require('../models/jsonCNLExporter')

let json_rome = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
let json_gdpr = fs.readFileSync("./test/fixtures/gdpr.json", "utf8");

const pairs = [
  ['{"text": "aaa","connective": {"code": "or", "formulas": [{"text": "aaa", "term": {"name": "a"}},{"text": "aaa", "term": {"name": "b"}}, {"text": "aaa", "term": {"name": "c"}}] } }','((a ; b) ; c)'],
  ['{"text": "ddd","connective": {"code": "label", "formulas": [{"text": "ccc", "term": {"name": "index1"}}, {"text": "aaa","connective": {"code": "or", "formulas": [{"text": "aaa", "term": {"name": "a"}},{"text": "aaa", "term": {"name": "b"}}, {"text": "aaa", "term": {"name": "c"}}]}} ] }}','((a ; b) ; c)'],
  [json_rome, '(validChoice(Law,Part) O> contract(Law,Part))'],
];

describe("JSON CNL Exporter", function(){
  it(`should export ${pairs[0][0]} correctly`, function(done){
    assert.equal(exporter.exportFormula(JSON.parse(pairs[0][0])), pairs[0][1]);
    done();
  });
  it(`should parse ${pairs[2][0]} correctly`, function(done){
    assert.equal(exporter.exportFormula(JSON.parse(pairs[2][0])), pairs[2][1]);
    done();
  });
  it("should parse correctly the GDPR JSON", function(done) {
    assert.equal(exporter.exportFormula(JSON.parse(json_gdpr)), "(((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) O> communicate_at_time(Y,W,T,contact_details(Y))) , (((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) , representative(K,Y)) O> communicate_at_time(Y,W,T,contact_details(K))))");
    done();
  });
  it("should parse correctly obmacro1 containing VAR on the left side as well", function(done) {
    let gdpr = JSON.parse(json_gdpr)
    let cond = gdpr.connective.formulas[0]
    let lhsVAR = {
					"text":"at the time when personal data are obtained, provide the data subject with all of the following information",
					"term":
					{
						"name":"communicate_at_time(Y,W,T,VAR)"
					}
				}
    let newCond = exporter.createConnective("and", [lhsVAR, cond])
    gdpr.connective.formulas[0] = newCond
    assert.equal(exporter.exportFormula(gdpr), "(((communicate_at_time(Y,W,T,contact_details(Y)) , (((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z))) O> communicate_at_time(Y,W,T,contact_details(Y))) , (((communicate_at_time(Y,W,T,contact_details(K)) , (((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z))) , representative(K,Y)) O> communicate_at_time(Y,W,T,contact_details(K))))");
    done();
  });

})

