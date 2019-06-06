var P = require('parsimmon');
var crypto = require('crypto');
var hash; // used to rename variables within the formula

function norm(n,pos) {
  return n * 2 + pos
}

function o1(f,n) {
  return `(# ${norm(n,1)}^d: ${f})`
}

function o2(f,n) {
  return `(# ${norm(n,2)}^d: ~ ${f})`
}

function ob(f,n) {
  return `(${o1(f,n)}, ${o2(f,n)})`
}

function p1(f,n) {
  return `(* ${norm(n,1)}^d: ${f})`
}

function p2(f,n) {
  return `(* ${norm(n,2)}^d: ~ ${f})`
}

function pm(f,n) {
  return `(${p1(f,n)}, ${p2(f,n)})`
}

function fb(f,n) {
  var nf = `(~ ${f})`
  return `(~ ${ob(nf,n)})`
}

function pimp(f1,f2,n) {
  return `((${f1} => ${pm(f2,n)}),(${o1(pm(f1,n),n)} => ${o1(pm(f2,n),n)}))`
}

function oimp(f1,f2,n) {
  return `((${f1} => ${ob(f2,n)}),(${o1(ob(f1,n),n)} => ${o1(ob(f2,n),n)}))`
}

function fimp(f1,f2,n) {
  return `((${f1} => ${fb(f2,n)}),(${o1(fb(f1,n),n)} => ${o1(fb(f2,n),n)}))`
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

  formula: r => P.alt(r.unary, r.nbinary, r.binary, r.vatom),

  unary: r => P.seq(r.lparen, P.alt(r.neg, r.permitted, r.forbidden, r.ought, r.ideal), r.rparen).tie(),

  neg: r => P.seq(word("~ "), r.formula).tie(),

  permitted: r => P.seqMap(word("Pm^").then(r.integer).or(word("Pm ").map(_ => 0)), r.formula, function(n,f) {return  pm(f,n)}),

  forbidden: r => P.seqMap(word("Fb^").then(r.integer).or(word("Fb ").map(_ => 0)), r.formula, function(n,f) {return  fb(f,n)}),

  ought: r => P.seqMap(word("Ob^").then(r.integer).or(word("Ob ").map(_ => 0)), r.formula, function(n,f) {return  ob(f,n)}),

  ideal: r => P.seqMap(word("Id^").then(r.integer).or(word("Id ").map(_ => 0)), r.formula, function(n,f) {return  o1(f,n)}),

  binary: r => P.seq(r.lparen, r.formula, P.alt(word(","), word(";"), word("=>"), word("<=>")), r.formula, r.rparen).tie(),

  nbinary: r => P.seq(r.lparen, P.alt(r.no,r.po,r.fo), r.rparen).tie(),

  no: r => P.seqMap(r.formula, word("O>^").then(r.integer).or(word("O>").map(_ => 0)), r.formula, function(f1,n,f2) {return oimp(f1,f2,n)}),

  po: r => P.seqMap(r.formula, word("P>^").then(r.integer).or(word("P>").map(_ => 0)), r.formula, function(f1,n,f2) {return pimp(f1,f2,n)}),

  fo: r => P.seqMap(r.formula, word("F>^").then(r.integer).or(word("F>").map(_ => 0)), r.formula, function(f1,n,f2) {return fimp(f1,f2,n)}),

  atom: r => P.alt(r.tre, r.fls, r.func, r.constant),

  tre: () => word("true").map(() => "(not_a_prop ; (~ not_a_prop))"),

  fls: () => word("false").map(() => "(not_a_prop , (~ not_a_prop))"),

  vatom: r => P.alt(r.atom, r.variable),

  func: r => P.seq(r.constant, r.lparen, r.arglist, r.rparen).tie(),

  arglist: r => r.vatom.sepBy1(word(",")).tieWith(","),

  integer: () => reg(/[0-9]+/),

  constant: () => reg(/[a-z][a-zA-Z_\d]*/),

  /*
   * Not any longer
   * Since we use prenex quantification, each formula should use a different variable.
   * This can be computed by taking the hash of the original sentence and attach it to the variables
   */
  //variable: () => reg(/[A-Z][a-zA-Z_\d]*/).map(v => v.concat(hash)),
  variable: () => reg(/[A-Z][a-zA-Z_\d]*/).map(v => v.concat('__var')),

  list: r => r.lbracket.then(r.formula.sepBy(r.comma).map(addParents)).skip(r.rbracket),

});

exports.parseFormula = function(str) {
  if (str.includes('__var'))
    throw 'DL* formulae must not contain "__var"'
  //hash = crypto.createHash('md5').update(str).digest('hex');
  var form = lang.formula.tryParse(str);
  var vars = form.match(/[A-Z][a-zA-Z_\d]*__var/g)
  if (vars)
    return '(' + vars.map(x => `all ${x}:`).join('') + form + ')'
  else
    return form
}

exports.parse = function(str) {
  return lang.problem.tryParse(str);
}
