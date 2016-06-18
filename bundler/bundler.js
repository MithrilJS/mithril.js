"use strict"

var fs = require("fs")
var path = require("path")

var modules = {}
var usedVariables = {}

function resolve(dir, data) {
	var replacements = []
	data = data.replace(/((?:var|let|const|)[\t ]*)([\w_$\.]+)(\s*=\s*)require\(([^\)]+)\)/g, function(match, def, variable, eq, dep) {
		usedVariables[variable] = usedVariables[variable] ? usedVariables[variable]++ : 1

		var filename = new Function("return " + dep).call()
		var normalized = path.resolve(dir, filename)
		var pathname = path.dirname(normalized)
		if (modules[normalized] === undefined) {
			modules[normalized] = variable
			var exported = fixCollisions(fs.readFileSync(dir + "/" + filename + ".js", "utf8"))
				.replace(/"use strict"\s*/gm, "") // remove extraneous "use strict"
				.replace(/module\.exports\s*=\s*/gm, def + variable + eq)
				//.replace(/module\.exports(\.[\w_$]|\["[^\"]"\])/, def + variable + eq + "{}\n" + variable + "$1")
			return resolve(pathname, exported)
		}
		else {
			if (modules[normalized] !== variable) {
				replacements.push({variable: variable, replacement: modules[normalized]})
			}
			return ""
		}
	})
	if (replacements.length > 0) {
		for (var i = 0; i < replacements.length; i++) {
			data = data.replace(new RegExp("\\b" + replacements[i].variable + "\\b", "g"), replacements[i].replacement)
		}
	}
	return data
		.replace(/(?:var|let|const)[\t ]([\w_$\.]+)(\s*=\s*)\1([\r\n;]+)/g, "$3") // remove assignments to itself
		.replace(/([\r\n]){2,}/g, "$1") // remove multiple consecutive line breaks
		.replace(/\}[\r\n]+\(/g, "}(") // remove space from iife
}

function fixCollisions(code) {
	for (var variable in usedVariables) {
		var collision = new RegExp("\\b" + variable + "\\b(?![\"'`])", "g")
		var exported = new RegExp("module\\.exports\\s*=\\s*" + variable)
		if (collision.test(code) && !exported.test(code)) {
			var fixed = variable + usedVariables[variable]++
			code = code.replace(collision, fixed)
		}
	}
	return code
}

function bundle(input, output) {
	var code = resolve(".", fs.readFileSync(input, "utf8"))
	if (new Function(code)) fs.writeFileSync(output, code, "utf8")
}

bundle("index.js", "mithril.js")
