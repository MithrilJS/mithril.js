"use strict"

var fs = require("fs")
var path = require("path")

var modules = {}

function resolve(dir, data) {
	var replacements = []
	data = data.replace(/((?:var|let|const|)\s*)([\w_$]+)(\s*=\s*)require\(([^\)]+)\)/g, function(match, def, variable, eq, dep) {
		var filename = new Function("return " + dep).call()
		var pathname = path.dirname(path.resolve(dir, filename))
		var normalized = path.normalize(dir + "/" + filename)
		if (modules[normalized] === undefined) {
			modules[normalized] = variable
			return resolve(pathname,
				fs.readFileSync(dir + "/" + filename + ".js", "utf8")
					.replace(/"use strict"\s*/gm, "")
					.replace(/module\.exports\s*=\s*/gm, def + variable + eq)
					//.replace(/module\.exports(\.[\w_$]|\["[^\"]"\])/, def + variable + eq + "{}\n" + variable + "$1")
			)
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
}

fs.writeFileSync("mithril.js", resolve(".", fs.readFileSync("index.js", "utf8")), "utf8")
