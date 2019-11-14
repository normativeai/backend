var assert = require('assert')
const fs = require('fs');
const chai = require('chai');
const { expect } = chai;

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
    let newCond = parser.createConnective("and", [lhsVAR, cond])
    gdpr.connective.formulas[0] = newCond
    assert.equal(parser.parseFormula(gdpr), "(((communicate_at_time(Y,W,T,contact_details(Y)) , (((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z))) O> communicate_at_time(Y,W,T,contact_details(Y))) , (((communicate_at_time(Y,W,T,contact_details(K)) , (((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z))) , representative(K,Y)) O> communicate_at_time(Y,W,T,contact_details(K))))");
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
  it(`should parse paragraphs 1,2 and 4 of the GDPR article 13 correctly`, function(done){
    let par1 = (JSON.parse(fs.readFileSync("./test/fixtures/gdpr_13_1.json", "utf8")));
    let par2 = (JSON.parse(fs.readFileSync("./test/fixtures/gdpr_13_2.json", "utf8")));
    let par4 = (JSON.parse(fs.readFileSync("./test/fixtures/gdpr_13_4.json", "utf8")));
    let res = threePasses([par1,par2,par4])
    expect(res[0]).to.equal("(((((((((((~ already_has(Subject, contact_details(Controller))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) O> communicate_at_time(Controller, Subject, Time, contact_details(Controller))) , ((((~ already_has(Subject, contact_details(Representive))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , representive(Controller, Representive)) O> communicate_at_time(Controller, Subject, Time, contact_details(Representive)))) , ((((~ already_has(Subject, contact_details(DPO))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , data_protection_officer(DPO,Data)) O> communicate_at_time(Controller, Subject, Time, contact_details(DPO)))) , (((~ already_has(Subject, purpose_of_processing(Purpose, Data))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) O> communicate_at_time(Controller, Subject, Time, purpose_of_processing(Purpose, Data)))) , (((~ already_has(Subject, legal_basis(LegalBasis, Purpose))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) O> communicate_at_time(Controller, Subject, Time, legal_basis(LegalBasis, Purpose)))) , ((((~ already_has(Subject, legitimate_interest_third_party_or(Party,Controller))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , justification_based(Justification, article_6_1)) O> communicate_at_time(Controller, Subject, Time, legitimate_interest_third_party_or(Party,Controller)))) , ((((~ already_has(Subject, recepients_of_data(Recipients))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , recipients_personal_data(Recipients, Data)) O> communicate_at_time(Controller, Subject, Time, recepients_of_data(Recipients)))) , ((((~ already_has(Subject, information_of_transfer(Controller, Data, Country, Information))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , intent_transfer_data_to(Controller, Data, Country)) O> communicate_at_time(Controller, Subject, Time, information_of_transfer(Controller, Data, Country, Information)))) , ((((~ already_has(Subject, appropriate_safeguards(Controller, Data, Country, SafeGuards))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , transfer_relates_to(Controller, Data, Country, article_46_47_p2_article_49_1)) O> communicate_at_time(Controller, Subject, Time, appropriate_safeguards(Controller, Data, Country, SafeGuards))))")
    expect(res[1]).to.equal("(((((((((((~ already_has(Subject, stored_during(Data, Period))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) O> communicate_at_time(Controller, Subject, Time, stored_during(Data, Period))) , ((((~ already_has(Subject, criteria_storing_data(Data,Criteria))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , (~ stored_during(Data, Period))) O> communicate_at_time(Controller, Subject, Time, criteria_storing_data(Data,Criteria)))) , (((~ already_has(Subject, existence_right_of(Controller, Subject, Data, access_rectification_etc))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) O> communicate_at_time(Controller, Subject, Time, existence_right_of(Controller, Subject, Data, access_rectification_etc)))) , ((((~ already_has(Subject, existence_right_of(Controller, Subject, Data, withdraw_consent_etc))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , personal_data_processed_at_time(Processor, Data, Time, article_6_1_article_9_2_a)) O> communicate_at_time(Controller, Subject, Time, existence_right_of(Controller, Subject, Data, withdraw_consent_etc)))) , (((~ already_has(Subject, existence_right_of(Controller, Subject, Data, lodge_complaint))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) O> communicate_at_time(Controller, Subject, Time, existence_right_of(Controller, Subject, Data, lodge_complaint)))) , ((((~ already_has(Subject, info(ProvisionType))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , type_provision(Subject, Data, ProvisionType)) O> communicate_at_time(Controller, Subject, Time, info(ProvisionType)))) , (((~ already_has(Subject, info(ProvisionType))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) O> communicate_at_time(Controller, Subject, Time, info(ProvisionType)))) , ((((~ already_has(Subject, info_obliged_give_data(IsObliged, Consequences))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) , (is_obliged_to_give(Subject,Data,IsObliged) , consequence_refusing_to_give(Subject,Data, Consequences))) O> communicate_at_time(Controller, Subject, Time, info_obliged_give_data(IsObliged, Consequences)))) , (((~ already_has(Subject, existence_ai(Data,Algorithm))) , ((~ already_has(Subject, VAR)) , (((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , data_subject(Subject)) , controller(Controller, Data)))) O> communicate_at_time(Controller, Subject, Time, existence_ai(Data,Algorithm))))")
    done();
  });

})

