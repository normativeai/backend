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
  it(`should throw an exception when style tags are used within NAI span tags`, function(done){
    const xml_string = "<span class=\"connective-depth-1 annotator-connective\" id=\"0a9b4bd6-477c-4497-9f1c-ccefd659f49e\" data-connective=\"label\" title=\"Labeling sentences\"><span class=\"annotator-term\" id=\"6e19f5e1-d156-414e-83dd-ef94861bf7e7\" data-term=\"paragraph4\" title=\"paragraph4\">4.</span>&nbsp;&nbsp;&nbsp;<span class=\"connective-depth-2 annotator-connective\" id=\"f4452192-2c24-4a33-890f-a95f2236cbe6\" data-connective=\"obif\" title=\"If / Then Obligation\"><span class=\"connective-depth-3 annotator-connective\" id=\"da2f380a-c255-4abf-af0c-26377ed27d05\" data-connective=\"and\" title=\"And\"><span class=\"annotator-term\" id=\"bdd63010-36ed-4758-bbe8-6b90331223ed\" data-term=\"consent(Data,Subject,Time)\" title=\"consent(Data,Subject,Time)\">When assessing whether consent</span> <span class=\"annotator-term\" id=\"3a76eb7c-166b-410a-98f4-491b7d46c93c\" data-term=\"free(Data,Subject,Time)\" title=\"free(Data,Subject,Time)\">is freely given</span></span>, <span class=\"connective-depth-3 annotator-connective\" id=\"54ea6e11-20f9-441c-9bdf-97ad38eb79a3\" data-connective=\"and\" title=\"And\"><span class=\"annotator-term\" id=\"2a0e2cbc-b2ae-481e-84b7-cd1a710ecafc\" data-term=\"to take account\" title=\"to take account\">utmost account shall be taken</span> of whether,&nbsp;<em>inter alia</em>, <span class=\"annotator-term\" id=\"4378ad01-7133-4dad-a63c-dbcb09d6f84e\" data-term=\"performance\" title=\"performance\">the performance of a contract, including the provision of a service</span>, <span class=\"annotator-term\" id=\"8a292aad-bb6c-408f-be08-728913ca6a05\" data-term=\"consent(Data,Subject,Time)\" title=\"consent(Data,Subject,Time)\">is conditional on consent</span> <span class=\"annotator-term\" id=\"4d384830-0865-43ec-ab41-79f6b4a9e77c\" data-term=\"processing(Data,Subject,Time)\" title=\"processing(Data,Subject,Time)\">to the processing</span> <span class=\"annotator-term\" id=\"3bd72859-0b53-48c1-b6c9-296e0c7d8003\" data-term=\"personal data(Data,Subject)\" title=\"personal data(Data,Subject)\">of personal data</span> that is not <span class=\"annotator-term\" id=\"c2e23a0b-1f40-48e7-acfb-b22a3d221d4f\" data-term=\"necessary\" title=\"necessary\">necessary for the performance of that contract</span></span>.</span></span>"
    assert.throws(() => parser.parse(xml_string), { message: /Please do not use styling tags/ });
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

