const cheerio = require('cheerio');
var logger = require('../config/winston');

const names = {
  "neg": "Not ___",
  "or": "___ Or ___ [Or ___ [...]]",
  "and": "___ And ___ [And ___ [...]]",
  /*"eq": "Term Equality",*/
  "defif": "If ___ Then ___",
  "defonif": "___ If ___",
  "ob": "It Ought to be ___",
  "pm": "It is Permitted that ___",
  "fb": "It is Prohibited that ___",
  "id": "Ideally it is the case that ___",
  "obif": "If ___ Then it Ought to be ___",
  "obonif": "It Ought to be ___ If ___",
  "pmif": "If ___ Then it is permitted that ___",
  "pmonif": "It is permitted that ___ If ___",
  "fbif": "If ___ Then it is prohibited that ___",
  "fbonif": "It is prohibited that ___ If ___",
  "equiv": "___ is equivalent to ___"
}

function isAnnotationElement(spanElem) {
  var cls = spanElem.attr("class")
  if (cls) {
    return cls.split(" ").some(word => word.startsWith("annotator-"))
  } else {
    return false
  }
}

function parse(html) {
  const $ = cheerio.load(html);
  const forms = Array.from($("span").not("span span").filter(function(i,x) { return isAnnotationElement($(x))}).map(function(i, elem) {
    const ret = parseFormula($,elem)
    return ret
  }));
  return forms
}

function parseFormula($,spanElem) {
  const code = $(spanElem).attr("class").split(" ").find(word => word.startsWith("annotator-")).substring(10)
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
    case 'goal':
      return {
        "text": text,
        "goal": parseGoal($,spanElem)
      }
    default:
      throw {error: `Cannot parse XML. Unknown annotator value: ${code}`}
  }
}

function findAnnotationNonDirectChildren($,spanElem) {
  var children = []
  $(spanElem).children().each(function(i,e) {
    if (isAnnotationElement($(e))) {
      children.push(e)
    } else {
      children.push(findAnnotationNonDirectChildren($,e))
    }
  })
  return children
}

function parseConnective($,spanElem) {
  const connective = $(spanElem).attr("data-connective")
  /*const forms = Array.from($(spanElem).find($("span")).filter(function(i,x) {return isAnnotationElement($(x))}).map(function(i, elem) {
    return parseFormula($,elem)
  }));*/
  const children = findAnnotationNonDirectChildren($,spanElem)
  const forms = children.map(function(elem) {
    return parseFormula($,elem)
  });
  return {
    "name": names[connective],
    "code": connective,
    "formulas": forms
  }
}

function parseGoal($,spanElem) {
  const forms = Array.from($(spanElem).children().map(function(i, elem) {
    return parseFormula($,elem)
  }));
  if (forms.length != 1) {
    throw {error: 'A goal must contain one connective or term only'}
  }
  return {
    "formula": forms[0]
  }
}
function parseTerm($, spanElem) {
  const term = $(spanElem).attr("data-term")
  return {
    "name": term
  }
}

module.exports  = { "parse": parse, "ops": names };
