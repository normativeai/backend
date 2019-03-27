var assert = require('assert')

var parser = require('../models/queryParser')

const pairs = [
  ['([a,b],c)', 'f((a,b) => c).'],
  ['([aAv,bxxs],cDs)', 'f((aAv,bxxs) => cDs).'],
  ['([(~ a),b],c)', 'f(((~ a),b) => c).'],
  ['([(~  a), (Pm b)],c)','f(((~ a),(((* 1^d: b), (* 2^d: ~ b)))) => c).'],
  ['([(~  a), (Ob b)],c)','f(((~ a),(((# 1^d: b), (# 2^d: ~ b)))) => c).'],
  ['([a,(b; d)],c)', 'f((a,(b;d)) => c).'],
  ['([a,(b, d)],c)', 'f((a,(b,d)) => c).'],
  ['([a,(b => d)],c)', 'f((a,(b=>d)) => c).'],
  ['([a,(b <=> d)],c)', 'f((a,(b<=>d)) => c).'],
  ['([(~  a), (b O> d)],c)', 'f(((~ a),(((b => ((# 1^d: d), (# 2^d: ~ d))),((# 1^d: ((# 1^d: b), (# 2^d: ~ b))) => (# 1^d: ((# 1^d: d), (# 2^d: ~ d))))))) => c).'],
  ['([(~  a), (b P> d)],c)','f(((~ a),(((b => ((* 1^d: d), (* 2^d: ~ d))),((# 1^d: ((* 1^d: b), (* 2^d: ~ b))) => (# 1^d: ((* 1^d: d), (* 2^d: ~ d))))))) => c).'],
  ['(c)', 'f(c).'],
  ['([  a    ,   b   ] , c     )', 'f((a,b) => c).']
];

describe("Query parser", function(){
  it(`should parse the strings in ${pairs} correctly`, function(done){
    for(var i = 0 ; i < pairs.length; i++) {
      assert.equal(parser.parse(pairs[i][0]), pairs[i][1]);
    }
    done();
  });
})

