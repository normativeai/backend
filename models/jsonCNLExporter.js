var logger = require('../config/winston');
var xmlParser = require('./xmlParser');

function exportFormula(obj, state) {
  if (obj.hasOwnProperty('connective')){
		if (isMacro(obj.connective.code)) {
			return exportMacro(obj, state)
		} else {
			return exportConnector(obj, state);
		}
  } else if (obj.hasOwnProperty('term')){
    return `${obj.text}[${obj.term.name}]`;
  } else if (obj.hasOwnProperty('goal')){
    return exportGoal(obj);
  } else {
    throw {error: `Frontend error: The formula type ${obj.code} is not known.`};
  }
}

function exportGoal(obj) {
  return exportFormula(obj.goal.formula);
}

function ident(state) {
  let arr = Array.from(Array(state.level).keys()).reduce((acc,x) => acc+" ","")
  return arr
}
function inc(state) {
  return {level: state.level+1}
}
function identBinary(w1,f1,w2,f2,state,w3) {
  let w3s = w3 ? `${ident(state)}${w3}` : ""
  return `${ident(state)}${w1}\n${ident(inc(state))}${f1}\n${ident(state)}${w2}\n${ident(inc(state))}${f2}${w3s}\n`;
}

function identUnary(w1,f1,state) {
  return `${ident(state)}${w1}\n${ident(inc(state))}${f1}`;
}

function identMulti(w,fs,state) {
  return fs.slice(1).reduce(function(acc, val) {
    return `${acc}\n${ident(state)}${w} ${val}`
  }, `${ident(state)}${fs[0]}`);
}

function exportConnector(obj, state) {
    var formulas = obj.connective.formulas.map(f => exportFormula(f, inc(state)));
    var argsNum = expectedArgs(obj.connective.code);
    if (argsNum < 0 && formulas.length < 2) {
      throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes at least two operands, but ${formulas.length} were given.`}
    }
    if (argsNum >= 0 && formulas.length != argsNum) {
      throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes ${argsNum} operands, but ${formulas.length} were given.`}
    }
    switch (obj.connective.code) {
      case "neg":
        return identUnary("NOT", formulas[0], state);
      case "or":
        return identMulti("OR", formulas, state);
      case "and":
        return identMulti("AND", formulas, state);
      case "eq":
        throw "Equality operators are not yet supported!"
      case "defif":
        return identBinary("IF",formulas[0],"THEN",formulas[1],state);
      case "defonif":
        return identBinary("IF",formulas[1],"THEN",formulas[0],state);
      case "ob":
        return identUnary("YOU MUST", formula[0], state);
      case "pm":
        return identUnary("YOU ARE ALLOWED", formula[0], state);
      case "fb":
        return identUnary("YOU ARE FORBIDDEN", formula[0], state);
      case "id":
        throw "Not supported!"
      case "obif":
        return identBinary("IF",formulas[0],"THEN YOU MUST",formulas[1],state);
      case "obonif":
        return identBinary("IF",formulas[1],"THEN YOU MUST",formulas[0],state);
      case "pmif":
        return identBinary("IF",formulas[0],"THEN YOU ARE PERMITTED",formulas[1],state);
      case "pmonif":
        return identBinary("IF",formulas[1],"THEN YOU ARE PERMITTED",formulas[0],state);
      case "spmif":
        throw "Not supported!"
      case "spmonif":
        throw "Not supported!"
      case "fbif":
        return identBinary("IF",formulas[0],"THEN YOU ARE FORBIDDEN",formulas[1],state);
      case "fbonif":
        return identBinary("IF",formulas[1],"THEN YOU ARE FORBIDDEN",formulas[0],state);
      case "equiv":
        return identBinary("IT HOLDS",formulas[0],"IF AND ONLY IF",formulas[1],state);
       default:
        throw {error: `Frontend error: Connective ${obj.connective.code} is not known.`};
    }
}

function exportMacro(obj, state) {
	let formulas =  obj.connective.formulas
  var argsNum = expectedArgs(obj.connective.code);
  if (argsNum < 0 && formulas.length < 2) {
    throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes at least two operands, but ${formulas.length} were given.`}
  }
  if (argsNum >= 0 && formulas.length != argsNum) {
    throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes ${argsNum} operands, but ${formulas.length} were given.`}
  }
  switch (obj.connective.code) {
    case "label":
      /*
       * This macro allows for the labeling of formulae
       * The formulae is exportd as usual and is returned by this method
       * At the same time, it is indexed by the term and is stored in this jsonexportr for further use
       * This happens in pass # 1
       */
      if (!formulas[0].hasOwnProperty('term')) {
        throw {error: `Frontend error: ${obj.connective.name} must have a term on the first argument.Got instead ${JSON.stringify(formulas[0])}`};
      }
      return `${ident(state)}${formulas[0].term.name})${exportFormula(formulas[1], inc(state))}`
    case "exception":
      let condition = formulas[formulas.length-1]
      let fs = formulas.slice(0, -1).map(term => {
        if (!isTerm(term)) {
          throw {error: `Frontend error: Labels must be terms, got ${JSON.stringify(term)}`}
        }
        return term.term.name
      })
      return identBinary("IF", condition, "THEN THE FOLLOWING", fs, state, "DO NOT HOLD")
    case "obmacro1":
			/*
				This macro simulates obif but accepts a multi obligation rhs (as a conjunction).
				The first element in the conjuct is the term to place in the obligation (containing the VAR value)
        VAR can also be contained on the left hand side
				It creates one obligation for each other conjunct on the rhs while replacing the macro VAR in the
					first element with the term in the conjunct.
				If the conjuct is not a term but an implication, it addes all the lhs of the implication to the lhs of the obligation.
			*/
			// ensure second argument is a conjunction
			if (!formulas[1].hasOwnProperty('connective') || !isOfType(formulas[1].connective, "and")) {
				throw {error: `Frontend error: ${obj.connective.name} must have a conjunct on the second argument.`};
			}
			// export conjunction
			//let conj = formulas[1].connective.formulas.map(exportFormula)
			// extract ob rhs from conjunction
			let obform = exportFormula(formulas[1].connective.formulas[0], state)
			let conj = formulas[1].connective.formulas.slice(1)
			// lhs
			let lhs = formulas[0]
			// define function combining everything for each conjunct in conj
			let combine = function(conjunct) {
				var clhs
				var crhs
				// if conjunct is a implication, obtain lhs and rhs
				if (conjunct.hasOwnProperty('term')) {
					clhs = exportFormula(lhs, state)
					crhs = exportFormula(conjunct, state)
				} else if (isOfType(conjunct.connective, "defif")) {
					// merge the lhs of the conjunct with that of the expression
					let bigand = createConnective('and', [lhs, conjunct.connective.formulas[0]])
					// export bigand
					clhs = exportFormula(bigand, state)
					crhs = exportFormula(conjunct.connective.formulas[1], state)
				} else if (isOfType(conjunct.connective, "defonif")) {
					// merge the lhs of the conjunct with that of the expression
					let bigand = createConnective('and', [lhs, conjunct.connective.formulas[1]])
					// export bigand
					clhs = exportFormula(bigand, state)
					crhs = exportFormula(conjunct.connective.formulas[0], state)
				} else {
					throw {error: `Frontend error: ${obj.connective.name} supports only terms or implications on the right hand side conjunct`};
				}
				// substitute cojunct for VAR in obform
				let obform2 = obform.replace('VAR', crhs)
				let clhs2 = clhs.replace('VAR', crhs)
				// return new obligation
				return identBinary("IF",clhs2,"THEN YOU MUST",obform2,state)

			}
			return conj.slice(1).reduce(function(acc,c) {
				return `${acc} AND ${combine(c)}`
			},combine(conj[0]))

    case "obmacro1-copy":
      /*
       * This macro intends of copying a obmacro1 sentence and change it. It has 3 parts
       * 1) An optional conjunction of further conditions to each obligation in obmacro1
       * 2) Additional obligations, which include also the VAR one in the first position. in this case, the new VAR replaces the copied one
       * 3) The label of the copied sentence
       * Note that the other macro must be before this one in the text. Order is important here since
       * both are handled in the same pass.
       */

      // first, we obtain the three parts, there can be 2 or 3 formulae in total
      let optConds = formulas[formulas.length-3]
      let addObs = formulas[formulas.length-2]
      let targetMacro = formulas[formulas.length-1]

      // check that the target macro is indicated using a term
      if (!isTerm(targetMacro)) {
        throw {error: `Frontend error: Labels must be terms, got ${JSON.stringify(targetMacro)}`}
      }

      // check that addObs contain a conjunction with VAR at the head
      if (!addObs.hasOwnProperty('connective') || addObs.connective.code != 'and' || !addObs.connective.formulas[0].term.name.includes('VAR')) {
        throw {error: `Frontend error: The additional obligations must be a conjunction with a VAR term in the first position`}
      }

      // ssecond, we obtain the target macro
      let label2 = exportFormula(targetMacro, state)
      let form = getFromState(label2, state)

      // we check that the target formula is indeed the right macro
      if (!form.hasOwnProperty('connective') || form.connective.code != 'obmacro1') {
        throw {error: `${obj.connective.name} can only copy from the relevant macro but got ${JSON.stringify(form.connective.code)}`}
      }

      // we need to replace its first formula with one containing the additional conditions, if they exist
      var conds = form.connective.formulas[0]
      if (optConds) {
        conds = createConnective('and', [optConds,conds])
      }

      // first remove the old VAR from a copy of the obligations
      let oldObs = form.connective.formulas[1].connective.formulas.slice()
      // remove the first element
      oldObs.splice(0,1)
      // add the new elements
      let obs = createConnective('and', addObs.connective.formulas.concat(oldObs))

      // lastly, we create a new obmacro1 with the new formulae
        return exportFormula(createConnective('obmacro1', [conds,obs]), state)
    default:
      throw {error: `Frontend error: Macro ${obj.connective.code} is not known.`};
  }
}

function getFromState(label, state) {
  let form = state.map.get(label) // first get the formula from the state
  let unique = computeUniqueLabel(form) // compute the hash
  return state.map.get(unique) || form // return the chained labeled formula if exists
}

function setInState(label, form, state) {
  state.map.set(label, form)
}

// this is used in order to create unique labels for formulae to be stored in the state
function computeUniqueLabel(formula) {
  var hash = 0;
  let text = JSON.stringify(formula)
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    hash = ((hash<<5)-hash)+character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash
}

function createConnective(conn, formulas) {
  let con = xmlParser.ops[conn]
	return {
			text:"Text cannot be retrieved currently as it is generated by a macro (TODO)",
			connective:
			{
				name: con.name,
				description: con.description,
				code: conn,
				formulas: formulas
			}
		}
}

function isTerm(obj) {
  return obj.hasOwnProperty('term')
}


function isOfType(connective, type) {
	return (connective.code == type)
}

function isMacro(code) {
	switch (code) {
		case "label":
		case "exception":
		case "obmacro1":
		case "obmacro1-copy":
			return true;
		default:
			return false;
	}
}

const obType = {
  OBLIGATION: 1,
  PROHIBITENCE: 2,
  SPERMISSION: 3 // the obligation generated from a strong permission
}

function extractViolations(obj) {
  if (obj.hasOwnProperty('connective')){
    switch (obj.connective.code) {
      case "and":
        const concat = (x,y) => x.concat(y)
        var ret = obj.connective.formulas.map(x => extractViolations(x)).reduce(concat, [])
        return ret
      case "obif":
        return extractFromObligation(obj.text, obj.connective.formulas[0], obj.connective.formulas[1], obType.OBLIGATION)
      case "obonif":
        return extractFromObligation(obj.text, obj.connective.formulas[1], obj.connective.formulas[0], obType.OBLIGATION)
      case "fbif":
        return extractFromObligation(obj.text, obj.connective.formulas[0], obj.connective.formulas[1], obType.PROHIBITENCE)
      case "fbonif":
        return extractFromObligation(obj.text, obj.connective.formulas[1], obj.connective.formulas[0], obType.PROHIBITENCE)
      case "spmif":
        return extractFromObligation(obj.text, obj.connective.formulas[0], obj.connective.formulas[1], obType.SPERMISSION)
      case "spmonif":
        return extractFromObligation(obj.text, obj.connective.formulas[1], obj.connective.formulas[0], obType.SPERMISSION)
      default:
        return []
    }
  } else {
    return []
  }
}

function extractFromObligation(text, lhs, rhs, ot) {
  var goal = rhs
  if (ot === obType.OBLIGATION) { // if we are doing an obligation and not a prohibition
    goal =
      {
        "text": `Negation of ${rhs.text}`,
        "connective": {
          "name": "Negation",
          "code": "neg",
          "formulas": [
            rhs
          ]
        }
      }
  }
  cond = lhs
  if (ot === obType.SPERMISSION) {
    cond =
      {
        "text": `Negation of ${lhs.text}`,
        "connective": {
          "name": "Negation",
          "code": "neg",
          "formulas": [
            lhs
          ]
        }
      }
  }
  return [{
      "text": `Violation of ${text}`,
      "connective": {
        "name": "Definitional Only If",
        "code": "defonif",
        "formulas": [
          {
            "text": "Violating the text",
            "term": {
              "name": "violation"
            }
          },
          {
            "text": text,
            "connective": {
              "name": "And",
              "code": "and",
              "formulas": [
                cond
                ,
                goal
              ]
            }
          }
        ]
      }
    }]
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
		case "obmacro1":
		case "label":
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

/*
 * Parsing is done by having three passes before returning formulae:
 * 1) Label all formulae
 * 2) Add exceptions
 * 3) compute formula taking into account all additional information which was gathered before
 */

module.exports  = { "exportFormula": exportFormula, "extractViolations": extractViolations,"arities": expectedArgs, "createConnective": createConnective };
