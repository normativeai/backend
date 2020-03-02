var P = require('parsimmon');
var crypto = require('crypto');
var hash; // used to rename variables within the formula

let counter  = 0

let pm = function(f) {
  return
    `<lrml:Permission
      key="perm${counter++}"
      iri="ex:achievementPermission">
      ${f}
    </lrml:Permission>`
}

var lang = P.createLanguage({

  lparen: () => word("("),
  rparen: () => word(")"),
  lbracket: () => word("["),
  rbracket: () => word("]"),
  comma: () => word(","),

  formula: r => P.alt(r.binary, r.nbinary, r.unary, r.vatom),

  unary: r => P.seq(r.lparen, P.alt(r.neg, r.permitted, r.forbidden, r.ought, r.ideal, r.awful), r.rparen).tie(),

  neg: r => P.seq(word("~ "), r.formula).tie(),
// can be removed
  agents_arglist: r => r.constant.sepBy1(word(",")),
// can be removed
  agents: r => P.alt(r.lbracket.then(r.agents_arglist.skip(r.rbracket)).map(ls => {return ls.reduce((acc,val, ind) => acc + Math.pow(10, ind) * val.charCodeAt(0), 0)}),r.integer),

  permitted: r => P.seqMap(word("Pm^").then(r.agents).or(word("Pm ").map(_ => 0)), r.formula, function(n,f) {return  pm(f,n)}),

  forbidden: r => P.seqMap(word("Fb^").then(r.agents).or(word("Fb ").map(_ => 0)), r.formula, function(n,f) {return  fb(f,n)}),

  ought: r => P.seqMap(word("Ob^").then(r.agents).or(word("Ob ").map(_ => 0)), r.formula, function(n,f) {return  ob(f,n)}),
// can be removed
  ideal: r => P.seqMap(word("Id^").then(r.agents).or(word("Id ").map(_ => 0)), r.formula, function(n,f) {return  id(f,n)}),
// can be removed
  awful: r => P.seqMap(word("Aw^").then(r.agents).or(word("Aw ").map(_ => 0)), r.formula, function(n,f) {return  aw(f,n)}),

  binary: r => P.seq(r.lparen, r.formula, P.alt(word(","), word(";"), word("=>"), word("<=>")), r.formula, r.rparen).tie(),

  nbinary: r => P.seq(r.lparen, P.alt(r.no,r.po,r.fo), r.rparen).tie(),

  no: r => P.seqMap(r.formula, word("O>^").then(r.agents).or(word("O>").map(_ => 0)), r.formula, function(f1,n,f2) {return oimp(f1,f2,n)}),

  po: r => P.seqMap(r.formula, word("P>^").then(r.agents).or(word("P>").map(_ => 0)), r.formula, function(f1,n,f2) {return pimp(f1,f2,n)}),

  fo: r => P.seqMap(r.formula, word("F>^").then(r.agents).or(word("F>").map(_ => 0)), r.formula, function(f1,n,f2) {return fimp(f1,f2,n)}),

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

exports.exportFormula = function(str) {
  var form = lang.formula.tryParse(str);
  return form
}
