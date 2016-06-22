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
		
		//resolve npm dependencies
		if (filename[0] !== ".") {
			var meta = JSON.parse(fs.readFileSync("./node_modules/" + filename + "/package.json"))
			var dependencyEntry = "./node_modules/" + filename + "/" + (meta.main || filename + ".js")
			try {fs.statSync(dependencyEntry).isFile()} catch (e) {dependencyEntry = "./node_modules/" + filename + "/index.js"}
			return resolve(path.dirname(dependencyEntry), exportCode(dependencyEntry, def + variable + eq))
		}
		
		//resolve local dependencies
		var normalized = path.resolve(dir, filename)
		var pathname = path.dirname(normalized)
		if (modules[normalized] === undefined) {
			modules[normalized] = variable
			var exported = exportCode(dir + "/" + filename + ".js", def + variable + eq)
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

function exportCode(file, assigment) {
	return fixCollisions(fs.readFileSync(file, "utf8"))
		.replace(/("|')use strict\1;?\s*/gm, "") // remove extraneous "use strict"
		.replace(/module\.exports\s*=\s*/gm, assigment)
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

function setVersion(code) {
	var metadata = JSON.parse(fs.readFileSync("./package.json"))
	return code.replace("bleeding-edge", metadata.version)
}

function bundle(input, output) {
	var code = setVersion(resolve(".", fs.readFileSync(input, "utf8")))
	if (new Function(code)) fs.writeFileSync(output, code, "utf8")
}

bundle("index.js", "mithril.js")
