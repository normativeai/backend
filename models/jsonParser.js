function parseFormula(obj) {
  switch (obj.code) {
    case "Connector":
      return parseConnector(obj.connector);
    case "Term":
      return obj.term;
    default:
      throw {error: `Frontend error: The formula type ${obj.code} is not known.`};
  }
}

function parseConnector(obj) {
  var formulas = obj.formulas.map(f => parseFormula(f));
  if (isBinary(obj.connectorCode)) {
    if (formulas.length != 2) {
      throw {error: `The sentence ${obj.text} contains the binary connective ${obj.name} but the number of operands is ${formulas.length}.`}
    }
  }
  switch (obj.connectorCode) {
    case "ObOnIf":
      return `(${formulas[1]} O> ${formulas[0]})`;
    default:
      throw {error: `Frontend error: Connective ${obj.connectorCode} is not known.`};
  }
}

function isBinary(conCode) {
  switch (conCode) {
    case "ObOnIf":
      return true;
    default:
      return false;
  }
}

module.exports  = { "parseFormula": parseFormula };
