function parseFormula(obj) {
  if (obj.hasOwnProperty('connective')){
    return parseConnector(obj);
  } else if (obj.hasOwnProperty('term')){
    return obj.term.name;
  } else if (obj.hasOwnProperty('goal')){
    return parseGoal(obj);
  } else {
    throw {error: `Frontend error: The formula type ${obj.code} is not known.`};
  }
}

function parseGoal(obj) {
  return parseFormula(obj.goal.formula);
}

function parseConnector(obj) {
  var formulas = obj.connective.formulas.map(f => parseFormula(f));
  var argsNum = expectedArgs(obj.connective.code);
  if (argsNum < 0 && formulas.length < 2) {
    throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes at least two operands, but ${formulas.length} were given.`}
  }
  if (argsNum >= 0 && formulas.length != argsNum) {
    throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes ${argsNum} operands, but ${formulas.length} were given.`}
  }
  switch (obj.connective.code) {
    case "neg":
      return `(~ ${formulas[0]})`;
    case "or":
      return formulas.slice(1).reduce(function(acc, val) {
        return `(${acc} ; ${val})`
      }, formulas[0]);
    case "and":
      return formulas.slice(1).reduce(function(acc, val) {
        return `(${acc} , ${val})`
      }, formulas[0]);
    case "eq":
      throw "Equality operators are not yet supported!"
    case "defif":
      return `(${formulas[0]} => ${formulas[1]})`;
    case "defonif":
      return `(${formulas[1]} => ${formulas[0]})`;
    case "ob":
      return `(Ob ${formulas[0]})`
    case "pm":
      return `(Pm ${formulas[0]})`
    case "fb":
      return `(Fb ${formulas[0]})`
    case "id":
      return `(Id ${formulas[0]})`
    case "obif":
      return `(${formulas[0]} O> ${formulas[1]})`;
    case "obonif":
      return `(${formulas[1]} O> ${formulas[0]})`;
    case "pmif":
      return `(${formulas[0]} P> ${formulas[1]})`;
    case "pmonif":
      return `(${formulas[1]} P> ${formulas[0]})`;
    case "fbif":
      return `(${formulas[0]} F> ${formulas[1]})`;
    case "fbonif":
      return `(${formulas[1]} F> ${formulas[0]})`;
    case "equiv":
      return `(${formulas[0]} <=> ${formulas[1]})`;
    default:
      throw {error: `Frontend error: Connective ${obj.connective.code} is not known.`};
  }
}

function expectedArgs(conCode) {
  switch (conCode) {
    case "defif":
    case "defonif":
    case "obonif":
    case "obif":
    case "pmonif":
    case "pmif":
    case "fbonif":
    case "fbif":
    case "eq":
    case "equiv":
      return 2
    case "neg":
    case "ob":
    case "pm":
    case "fb":
    case "id":
    case "neg":
      return 1
    default:
      return -1
  }
}

module.exports  = { "parseFormula": parseFormula, "arities": expectedArgs };
