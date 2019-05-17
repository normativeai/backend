function parseFormula(obj) {
  if (obj.hasOwnProperty('connective')){
    return parseConnector(obj.connective);
  } else if (obj.hasOwnProperty('term')){
    return obj.term.name;
  } else {
    throw {error: `Frontend error: The formula type ${obj.code} is not known.`};
  }
}

function parseConnector(obj) {
  var formulas = obj.formulas.map(f => parseFormula(f));
  var argsNum = expectedArgs(obj.code);
  if (argsNum < 0 && formulas.length < 2) {
    throw {error: `The sentence ${obj.text} contains the connective ${obj.name} which expectes at least two operands, but ${formulas.length} were given.`}
  }
  if (argsNum >= 0 && formulas.length != argsNum) {
    throw {error: `The sentence ${obj.text} contains the connective ${obj.name} which expectes ${argsNum} operands, but ${formulas.length} were given.`}
  }
  switch (obj.code) {
    case "obonif":
      return `(${formulas[1]} O> ${formulas[0]})`;
    case "defonif":
      return `(${formulas[1]} => ${formulas[0]})`;
    case "eq":
      return `true`; // TODO implement equality
    case "neg":
      return `(~ ${formulas[0]})`;
    case "or":
      return formulas.slice(1).reduce(function(acc, val) {
        return `(${acc} ; ${val})`
      }, formulas[0]);
    default:
      throw {error: `Frontend error: Connective ${obj.code} is not known.`};
  }
}

function expectedArgs(conCode) {
  switch (conCode) {
    case "obonif":
    case "defonif":
    case "eq":
      return 2
    case "neg":
      return 1
    default:
      return -1
  }
}

module.exports  = { "parseFormula": parseFormula };
