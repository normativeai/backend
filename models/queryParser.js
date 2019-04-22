var P = require('parsimmon');
var crypto = require('crypto');
var hash; // used to rename variables within the formula

function o1(f) {
  return `(# 1^d: ${f})`
}

function o2(f) {
  return `(# 2^d: ~ ${f})`
}

function ob(f) {
  return `(${o1(f)}, ${o2(f)})`
}

function p1(f) {
  return `(* 1^d: ${f})`
}

function p2(f) {
  return `(* 2^d: ~ ${f})`
}

function pm(f) {
  return `(${p1(f)}, ${p2(f)})`
}

function pimp(f1,f2) {
  return `((${f1} => ${pm(f2)}),(${o1(pm(f1))} => ${o1(pm(f2))}))`
}

function oimp(f1,f2) {
  return `((${f1} => ${ob(f2)}),(${o1(ob(f1))} => ${o1(ob(f2))}))`
}

let whitespace = P.regexp(/\s*/m);

// Let's make it easy to ignore  after most text.
function token(parser) {
  return parser.skip(whitespace);
}

// Several parsers are just strings with optional whitespace.
function word(str) {
  return P.string(str).thru(token);
}
// Several parsers are just regex with optional whitespace.
function reg(rgx) {
  return P.regex(rgx).thru(token);
}

function addParents(str) {
  return `(${str})`
}

var lang = P.createLanguage({

  lparen: () => word("("),
  rparen: () => word(")"),
  lbracket: () => word("["),
  rbracket: () => word("]"),
  comma: () => word(","),

  problem: r => r.lparen.then(P.alt(r.complexProblem, r.simpleProblem)).skip(r.rparen),

  complexProblem: r => P.seqMap(r.list.skip(r.comma), r.formula, function(list, conc) {return `f((${list} => ${conc})).`}),

  simpleProblem: r => r.formula.map(function(conc) {return `f((${conc})).`}),

  formula: r => P.alt(r.unary, r.nbinary, r.binary, r.atom),

  unary: r => P.seq(r.lparen, P.alt(r.neg, r.permitted, r.ought, r.ideal), r.rparen).tie(),

  neg: r => P.seq(word("~ "), r.formula).tie(),

  permitted: r => word("Pm ").then(r.formula).map(f => pm(f)),

  ought: r => word("Ob ").then(r.formula).map(f => ob(f)),

  ideal: r => word("Id ").then(r.formula).map(f => o1(f)),

  binary: r => P.seq(r.lparen, r.formula, P.alt(word(","), word(";"), word("=>"), word("<=>")), r.formula, r.rparen).tie(),

  nbinary: r => P.seq(r.lparen, P.alt(r.no,r.po), r.rparen).tie(),

  no: r => P.seqMap(r.formula.skip(word("O>")), r.formula, function(f1,f2) {return oimp(f1,f2)}),

  po: r => P.seqMap(r.formula.skip(word("P>")), r.formula, function(f1,f2) {return pimp(f1,f2)}),

  atom: r => P.alt(r.tre, r.fls, r.func, r.constant),

  tre: () => word("true").map(() => "(not_a_prop ; (~ not_a_prop))"),

  fls: () => word("false").map(() => "(not_a_prop , (~ not_a_prop))"),

  vatom: r => P.alt(r.atom, r.variable),

  func: r => P.seq(r.constant, r.lparen, r.arglist, r.rparen).tie(),

  arglist: r => r.vatom.sepBy1(word(",")).tieWith(","),

  constant: () => reg(/[a-z][a-zA-Z_\d]*/),

  /*
   * Since we use prenex quantification, each formula should use a different variable.
   * This can be computed by taking the hash of the original sentence and attach it to the variables
   */
  variable: () => reg(/[A-Z][a-zA-Z_\d]*/).map(v => v.concat(hash)),

  list: r => r.lbracket.then(r.formula.sepBy(r.comma).map(addParents)).skip(r.rbracket),

});

exports.parseFormula = function(str) {
  hash = crypto.createHash('md5').update(str).digest('hex');
  return lang.formula.tryParse(str);
}

console.log(lang.problem.tryParse('([(a_1 , b___2)], true)'));

exports.parse = function(str) {
  return lang.problem.tryParse(str);
}

console.log(exports.parseFormula('(a(X,Y) O> b(X,Y))'));

