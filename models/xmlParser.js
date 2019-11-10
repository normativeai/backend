const cheerio = require('cheerio');
var logger = require('../config/winston');

const names = {
  "neg": {"name": "Not", "description": "Not ___"},
  "or": {"name": "Or", "description": "___ Or ___ [Or ___ [...]]"},
  "and": {"name": "And", "description": "___ And ___ [And ___ [...]]"},
  /*"eq": "Term Equality",*/
  "defif": {"name": "If / Then", "description": "If ___ Then ___"},
  "defonif": {"name": "Always / If", "description": "___ If ___"},
  "ob": {"name": "Obligation", "description": "It Ought to be ___"},
  "pm": {"name": "Permission", "description": "It is Permitted that ___"},
  "fb": {"name": "Prohibitence", "description": "It is Prohibited that ___"},
  "id": {"name": "Ideally", "description": "Ideally it is the case that ___"},
  "obif": {"name": "If / Then Obligation", "description": "If ___ Then it Ought to be ___"},
  "obonif": {"name": "Always Obligation / If", "description": "It Ought to be ___ If ___"},
  "pmif": {"name": "If / Then Permission", "description": "If ___ Then it is weakly permitted that ___"},
  "pmonif": {"name": "Always Permission / If", "description": "It is weakly permitted that ___ If ___"},
  "spmif": {"name": "If / Then Strong Permission", "description": "If ___ Then it is strongly permitted that ___"},
  "spmonif": {"name": "Always Strong Permission / If", "description": "It is strongly permitted that ___ If ___"},
  "fbif": {"name": "If / Then Prohibition", "description": "If ___ Then it is prohibited that ___"},
  "fbonif": {"name": "Always Prohibition / If", "description": "It is prohibited that ___ If ___"},
  "equiv": {"name": "Equivalence", "description": "___ is equivalent to ___"},
  "label": {"name": "Labeling sentences", "description": " Use ___ to Label ___"},
  "obmacro1": {"name": "Macro for multi obligations", "description": "MACRO ___ ___"}
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
      throw Error(`Cannot parse XML. Unknown annotator value: ${code}`)
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
  var con = names[connective]
  var name = "undefined"
  var desc = "undefined"
  if (con) {
    name = con.name
    desc =con.description
  }
  return {
    "name": name,
    "description": desc,
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
