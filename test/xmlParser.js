var assert = require('assert')
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const chai = require('chai');
chai.use(deepEqualInAnyOrder);
const { expect } = chai;

const parser = require('../models/xmlParser')
const fs = require('fs');

describe("XML parser", function(){
  it(`should parse an xml string correctly 1`, function(done){
    let xml_string = fs.readFileSync("./test/fixtures/rome1.xml", "utf8");
    let json_string = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
    assert.equal(JSON.stringify(parser.parse(xml_string)[0]), JSON.stringify(JSON.parse(json_string)));
    done();
  });
  it(`should parse an xml string correctly 2`, function(done){
    const xml_string = "<p>Art. 3</p><p>A <span class=\"annotator-term\" id=\"f96e987b-65d9-4f63-981a-4f19ab3a9fd1\" data-term=\"contract(X,Y)\">contract</span> shall be governed by <span class=\"annotator-term\" id=\"153d2000-8f95-408e-88e3-7f7d5c71927c\" data-term=\"validChoice(X,Y)\">the law chosen by the parties</span>.<span style=\"color: rgb(0, 0, 0);\">The choice shall be made expressly or clearly demonstrated by the terms of the contract or the circumstances of the case.</span></p>"
    let json_string = '{"text":"contract","term":{"name":"contract(X,Y)"}}';
    assert.equal(JSON.stringify(parser.parse(xml_string)[0]), JSON.stringify(JSON.parse(json_string)));
    done();
  });
  it(`should parse an xml string correctly 3`, function(done){
    const xml_string = "<span id=\"some-id-1\" class=\"annotator-connective\" data-connective=\"ob\"><p><span id=\"some-id-3\" class=\"annotator-connective\" data-connective=\"ob\"><span id=\"some-id-2\" class=\"annotator-term\" data-term=\"contract(Law,Part)\"></span></span></p></span>"
    let json_string = '{"text":"","connective":{"name": "Obligation", "description": "It Ought to be ___","code":"ob","formulas":[{"text":"","connective":{"name": "Obligation", "description": "It Ought to be ___","code":"ob","formulas":[{"text":"","term":{"name":"contract(Law,Part)"}}]}}]}}'
    assert.equal(JSON.stringify(parser.parse(xml_string)[0]), JSON.stringify(JSON.parse(json_string)));
    done();
  });
  it(`should parse an xml string correctly 4`, function(done){
    const xml_string = "<span id=\"some-id-1\" class=\"annotator-connective\" data-connective=\"ob\"><span id=\"some-id-3\" class=\"annotator-connective\" data-connective=\"ob\"><p><span id=\"some-id-2\" class=\"annotator-term\" data-term=\"contract(Law,Part)\"></span></p></span></span>"
    let json_string = '{"text":"","connective":{"name": "Obligation", "description": "It Ought to be ___","code":"ob","formulas":[{"text":"","connective":{"name": "Obligation", "description": "It Ought to be ___","code":"ob","formulas":[{"text":"","term":{"name":"contract(Law,Part)"}}]}}]}}'
    assert.equal(JSON.stringify(parser.parse(xml_string)[0]), JSON.stringify(JSON.parse(json_string)));
    done();
  });
  it(`should parse the GDPR article 13 p. 1 xml correctly`, function(done){
    let xml_string = fs.readFileSync("./test/fixtures/gdpr_13.xml", "utf8");
    let json_string1 = fs.readFileSync("./test/fixtures/gdpr_13_1.json", "utf8");
    let jsons = parser.parse(xml_string)
    //expect(jsons[0]).to.deep.equalInAnyOrder(JSON.parse(json_string1))
    done();
  });
  it(`should parse the GDPR article 13 p. 2 xml correctly`, function(done){
    let xml_string = fs.readFileSync("./test/fixtures/gdpr_13.xml", "utf8");
    let json_string2 = fs.readFileSync("./test/fixtures/gdpr_13_2.json", "utf8");
    let jsons = parser.parse(xml_string)
    //expect(jsons[1]).to.deep.equalInAnyOrder(JSON.parse(json_string2))
    done();
  });
  it(`should parse the GDPR article 13 p. 4 xml correctly`, function(done){
    let xml_string = fs.readFileSync("./test/fixtures/gdpr_13.xml", "utf8");
    let json_string3 = fs.readFileSync("./test/fixtures/gdpr_13_4.json", "utf8");
    let jsons = parser.parse(xml_string)
    expect(jsons[2]).to.deep.equal(JSON.parse(json_string3))
    done();
  });

})

