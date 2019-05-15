var assert = require('assert')

const parser = require('../models/xmlParser')
const fs = require('fs');

describe("XML parser", function(){
  it(`should parse the first xml string correctly`, function(done){
    let xml_string = fs.readFileSync("./test/fixtures/rome1.xml", "utf8");
    let json_string = fs.readFileSync("./test/fixtures/rome1.json", "utf8");
    assert.equal(JSON.stringify(parser.parse(xml_string)[0]), JSON.stringify(JSON.parse(json_string)));
    done();
  });
})

