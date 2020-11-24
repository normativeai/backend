var P = require('parsimmon');
var crypto = require('crypto');
var hash; // used to rename variables within the formula

function id(f) {
  return `(#box(i) : ${f})`
}

function aw(f,n) {
  return `(#box(a) : ~ ${f})`
}

function ob(f) {
  return `(${id(f)} & ${aw(f)})`
}

function p1(f,n) {
  return `(#dia(i) : ${f})`
}

function p2(f,n) {
  return `(#dia(a) : ~ ${f})`
}

function pm(f) {
  return `(${p1(f)} & ${p2(f)})`
}

function fb(f) {
  var nf = `(~ ${f})`
  return ob(nf)
}

function pimp(f1,f2) {
  return `((${f1} => ${pm(f2)}) & (${id(pm(f1))} => ${id(pm(f2))}))`
}

function oimp(f1,f2) {
  return `((${f1} => ${ob(f2)}) & (${id(ob(f1))} => ${id(ob(f2))}))`
}

function fimp(f1,f2) {
  return `((${f1} => ${fb(f2)}) & (${id(fb(f1))} => ${id(fb(f2))}))`
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
  return `qmf(axiom,axiom,\n`
}

var lang = P.createLanguage({

  lparen: () => word("("),
  rparen: () => word(")"),
  lbracket: () => word("["),
  rbracket: () => word("]"),
  comma: () => word(","),

  formula: r => P.alt(r.binary, r.nbinary, r.unary, r.vatom),

  conjecture: r => P.alt(r.binary, r.nbinary, r.unary, r.vatom),

  unary: r => P.seq(r.lparen, P.alt(r.neg, r.permitted, r.forbidden, r.ought, r.ideal, r.awful), r.rparen).tie(),

  neg: r => P.seq(word("~ "), r.formula).tie(),

  permitted: r => P.seqMap(word("Pm "), r.formula, function(_,f) {return  pm(f)}),

  forbidden: r => P.seqMap(word("Fb "), r.formula, function(_,f) {return  fb(f)}),

  ought: r => P.seqMap(word("Ob "), r.formula, function(_,f) {return  ob(f)}),

  ideal: r => P.seqMap(word("Id "), r.formula, function(_,f) {return  id(f)}),

  awful: r => P.seqMap(word("Aw "), r.formula, function(_,f) {return  aw(f)}),

  binary: r => P.seq(r.lparen, r.formula, P.alt(word(",").map(_ => " & "), word(";").map(_ => " | "), word("=>").map(_ => " => "), word("<=>").map(_ => " <=> ")), r.formula, r.rparen).tie(),

  nbinary: r => P.seq(r.lparen, P.alt(r.no,r.po,r.fo), r.rparen).tie(),

  no: r => P.seqMap(r.formula, word("O>"), r.formula, function(f1,_,f2) {return oimp(f1,f2)}),

  po: r => P.seqMap(r.formula, word("P>"), r.formula, function(f1,_,f2) {return pimp(f1,f2)}),

  fo: r => P.seqMap(r.formula, word("F>"), r.formula, function(f1,_,f2) {return fimp(f1,f2)}),

  atom: r => P.alt(r.tre, r.fls, r.func, r.constant),

  tre: () => word("true").map(() => "(not_a_prop | (~ not_a_prop))"),

  fls: () => word("false").map(() => "(not_a_prop & (~ not_a_prop))"),

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

function quantify(str) {
  if (str.includes('__var'))
    throw 'DL* formulae must not contain "__var"'
  //hash = crypto.createHash('md5').update(str).digest('hex');
  var form = lang.formula.tryParse(str);
  let vars = Array.from(new Set(form.match(/[A-Z][a-zA-Z_\d]*__var/g)))
  if (vars.length > 0)
    return '(! [' + vars.join(',') + '] : ' + form + ')'
  else
    return form

}

exports.exportFormula = function(str,id) {
  return `qmf(axiom_${id},axiom,` +
    quantify(str)
  + ').'
}

exports.header = function() {
  return `
%----------------------------------------------------------------------------
% File     : Name : QMLTP v1.1
% Domain   : ?
% Problem  : ?
% Version  : ?
% English  : ?
%

% Source   :
% Names    :

% Status   : Theorem
% Rating   : 0.00  v1.1

%            domain condition for all modalities: const
%            term conditions  for all terms:
%            designation: rigid
%
% Comments :
%--------------------------------------------------------------------------

tpi(10,set_logic,modal([const,rigid,local],
                       [(i,d),(a,d)])).

`
}

exports.formulaSep = function() {
  return "\n\n"
}

exports.goalSep = function() {
  return "\n\n"
}

exports.exportGoal = function(str) {
  return 'qmf(con,conjecture,' +
    quantify(str) +
    ').'
}
