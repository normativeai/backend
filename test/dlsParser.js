var assert = require('assert')

var parser = require('../models/queryParser')

const pairs = [
  ['([a,b],c)', 'f(((a,b) => c)).'],
  ['([aAv,bxxs],cDs)', 'f(((aAv,bxxs) => cDs)).'],
  ['([a,b],c)', 'f(((a,b) => c)).'],
  ['([aAv,bxxs],cDs)', 'f(((aAv,bxxs) => cDs)).'],
  ['([a,b],c)', 'f(((a,b) => c)).'],
  ['([aAv,bxxs],cDs)', 'f(((aAv,bxxs) => cDs)).'],
  ['([(~ a),b],c)', 'f((((~ a),b) => c)).'],
  ['([(~  a), (Id b)],c)','f((((~ a),((# 1^d: b))) => c)).'],
  ['([(~  a), (Id^1 b)],c)','f((((~ a),((# 3^d: b))) => c)).'],
  ['([(~  a), (Aw b)],c)','f((((~ a),((# 2^d: ~ b))) => c)).'],
  ['([(~  a), (Aw^1 b)],c)','f((((~ a),((# 4^d: ~ b))) => c)).'],
  ['([(~  a), (Ob b)],c)','f((((~ a),(((# 1^d: b), (# 2^d: ~ b)))) => c)).'],
  ['([(~  a), (Ob^1 b)],c)','f((((~ a),(((# 3^d: b), (# 4^d: ~ b)))) => c)).'],
  ['([(~  a), (Fb b)],c)','f((((~ a),(((# 1^d: (~ b)), (# 2^d: ~ (~ b))))) => c)).'],
  ['([(~  a), (Fb^1 b)],c)','f((((~ a),(((# 3^d: (~ b)), (# 4^d: ~ (~ b))))) => c)).'],
  ['([(~  a), (Pm b)],c)','f((((~ a),(((* 1^d: b), (* 2^d: ~ b)))) => c)).'],
  ['([(~  a), (Pm^1 b)],c)','f((((~ a),(((* 3^d: b), (* 4^d: ~ b)))) => c)).'],
  ['([a,(b; d)],c)', 'f(((a,(b;d)) => c)).'],
  ['([a,(b, d)],c)', 'f(((a,(b,d)) => c)).'],
  ['([a,(b => d)],c)', 'f(((a,(b=>d)) => c)).'],
  ['([a,(b <=> d)],c)', 'f(((a,(b<=>d)) => c)).'],
  ['([(~  a), (b O> d)],c)', 'f((((~ a),(((b => ((# 1^d: d), (# 2^d: ~ d))),((# 1^d: ((# 1^d: b), (# 2^d: ~ b))) => (# 1^d: ((# 1^d: d), (# 2^d: ~ d))))))) => c)).'],
  ['([(~  a), (b P> d)],c)','f((((~ a),(((b => ((* 1^d: d), (* 2^d: ~ d))),((# 1^d: ((* 1^d: b), (* 2^d: ~ b))) => (# 1^d: ((* 1^d: d), (* 2^d: ~ d))))))) => c)).'],
  ['([(~  a), (b O>^1 d)],c)', 'f((((~ a),(((b => ((# 3^d: d), (# 4^d: ~ d))),((# 3^d: ((# 3^d: b), (# 4^d: ~ b))) => (# 3^d: ((# 3^d: d), (# 4^d: ~ d))))))) => c)).'],
  ['([(~  a), (b P>^1 d)],c)','f((((~ a),(((b => ((* 3^d: d), (* 4^d: ~ d))),((# 3^d: ((* 3^d: b), (* 4^d: ~ b))) => (# 3^d: ((* 3^d: d), (* 4^d: ~ d))))))) => c)).'],
  ['([(~  a), (b O>^2 d)],c)', 'f((((~ a),(((b => ((# 5^d: d), (# 6^d: ~ d))),((# 5^d: ((# 5^d: b), (# 6^d: ~ b))) => (# 5^d: ((# 5^d: d), (# 6^d: ~ d))))))) => c)).'],
  ['([(~  a), (b P>^2 d)],c)','f((((~ a),(((b => ((* 5^d: d), (* 6^d: ~ d))),((# 5^d: ((* 5^d: b), (* 6^d: ~ b))) => (# 5^d: ((* 5^d: d), (* 6^d: ~ d))))))) => c)).'],
  ['([(~  a), (b F> d)],c)', 'f((((~ a),(((b => ((# 1^d: (~ d)), (# 2^d: ~ (~ d)))),((# 1^d: ((# 1^d: (~ b)), (# 2^d: ~ (~ b)))) => (# 1^d: ((# 1^d: (~ d)), (# 2^d: ~ (~ d)))))))) => c)).'],
  ['(c)', 'f((c)).'],
  ['([((Ob X) => (Ob^1 X))],c)','f(((((((# 1^d: X__var), (# 2^d: ~ X__var)))=>(((# 3^d: X__var), (# 4^d: ~ X__var))))) => c)).'],
  ['([((Ob X) => (Ob^[x,y] X))],c)','f(((((((# 1^d: X__var), (# 2^d: ~ X__var)))=>(((# 2661^d: X__var), (# 2662^d: ~ X__var))))) => c)).'],
  ['([  a    ,   b   ] , c     )', 'f(((a,b) => c)).']
];

const pairs2 = [
  ['(((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) O> communicate_at_time(Y,W,T,contact_details(Y))) , (((((((processor(X) , nominate(Y,X)) , personal_data_processed_at_time(X,Z,T)) , personal_data(Z,W)) , data_subject(W)) , controller(Y,Z)) , representative(K,Y)) O> communicate_at_time(Y,W,T,contact_details(K))))', '(all X__var:all Y__var:all Z__var:all T__var:all W__var:all K__var:(((((((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var)) => ((# 1^d: communicate_at_time(Y__var,W__var,T__var,contact_details(Y__var))), (# 2^d: ~ communicate_at_time(Y__var,W__var,T__var,contact_details(Y__var))))),((# 1^d: ((# 1^d: (((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var))), (# 2^d: ~ (((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var))))) => (# 1^d: ((# 1^d: communicate_at_time(Y__var,W__var,T__var,contact_details(Y__var))), (# 2^d: ~ communicate_at_time(Y__var,W__var,T__var,contact_details(Y__var)))))))),(((((((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var)),representative(K__var,Y__var)) => ((# 1^d: communicate_at_time(Y__var,W__var,T__var,contact_details(K__var))), (# 2^d: ~ communicate_at_time(Y__var,W__var,T__var,contact_details(K__var))))),((# 1^d: ((# 1^d: ((((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var)),representative(K__var,Y__var))), (# 2^d: ~ ((((((processor(X__var),nominate(Y__var,X__var)),personal_data_processed_at_time(X__var,Z__var,T__var)),personal_data(Z__var,W__var)),data_subject(W__var)),controller(Y__var,Z__var)),representative(K__var,Y__var))))) => (# 1^d: ((# 1^d: communicate_at_time(Y__var,W__var,T__var,contact_details(K__var))), (# 2^d: ~ communicate_at_time(Y__var,W__var,T__var,contact_details(K__var))))))))))']
];
describe("Query parser", function(){
  it(`should parse the strings in ${pairs} correctly`, function(done){
    for(var i = 0 ; i < pairs.length; i++) {
      assert.equal(parser.parse(pairs[i][0]), pairs[i][1]);
    }
    done();
  });
  it(`should parse the strings in ${pairs2} correctly (for formulae)`, function(done){
    for(var i = 0 ; i < pairs2.length; i++) {
      assert.equal(parser.parseFormula(pairs2[i][0]), pairs2[i][1]);
    }
    done();
  });

})

