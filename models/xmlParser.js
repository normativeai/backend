const cheerio = require('cheerio');

const names = {
  "neg": "Negation",
  "or": "Or",
  "and": "And",
  "eq": "Term Equality",
  "defif": "Definitional If",
  "defonif": "Definitional Only If",
  "ob": "Obligation",
  "pm": "Permission",
  "fb": "Forbidden",
  "id": "Ideally",
  "obif": "Obligation If",
  "obonif": "Obligation Only If",
  "pmif": "Permission If",
  "pmonif": "Permission Only If",
  "fbif": "Forbidden If",
  "fbonif": "Forbidden Only If"
}

function parse(html) {
  const $ = cheerio.load(html);
  const forms = Array.from($("li > span").map(function(i, elem) {
    return parseFormula($,elem)
  }));
  return forms
}

function parseFormula($,spanElem) {
  const code = $(spanElem).attr("class").substring(10)
  const text = $(spanElem).contents().text();
  switch (code) {
    case 'connective':
      return {
        "text": text,
        "connective": parseConnective($,spanElem)
      }
    case 'term':
      return {
        "text": text,
        "term": parseTerm($,spanElem)
      }
      return parseTerm($,spanElem)
    default:
      raise `Cannot parse XML. Unknown annotator value: ${code}`
  }
}

function parseConnective($,spanElem) {
  const connective = $(spanElem).attr("data-connective")
  const forms = Array.from($(spanElem).children().map(function(i, elem) {
    return parseFormula($,elem)
  }));
  return {
    "name": names[connective],
    "code": connective,
    "formulas": forms
  }
}

function parseTerm($, spanElem) {
  const term = $(spanElem).attr("data-term")
  return {
    "name": term
  }
}

module.exports  = { "parse": parse, "ops": names };
