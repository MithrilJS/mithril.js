"use strict"

var fs = require("fs")
var path = require("path")

module.exports = function(input, output, options) {
	function run(e, file) {
		var modules = {}
		var usedVariables = {}
		var globals = {}

		function resolve(dir, data) {
			var replacements = []
			
			var globalMatch = data.match(/window\.([\w_$]+)\s*=\s*/)
			if (globalMatch) globals[globalMatch[1]] = true
			
			data = data.replace(/^\s*\/\/[^\n]*/g, "").replace(/((?:var|let|const|)[\t ]*)([\w_$\.]+)(\s*=\s*)require\(([^\)]+)\)/g, function(match, def, variable, eq, dep) {
				usedVariables[variable] = usedVariables[variable] ? usedVariables[variable]++ : 1

				var filename = new Function("return " + dep).call()
				
				//resolve npm dependencies
				if (filename[0] !== ".") {
					var meta
					try {meta = JSON.parse(fs.readFileSync("./node_modules/" + filename + "/package.json"))} catch (e) {meta = {}}
					var dependencyEntry = "./node_modules/" + filename + "/" + (meta.main || filename + ".js")
					try {fs.statSync(dependencyEntry).isFile()} catch (e) {dependencyEntry = "./node_modules/" + filename + "/index.js"}
					return process(dependencyEntry)
				}
				
				//resolve local dependencies
				return process(dir + "/" + filename + ".js")
				
				function process(dependency) {
					var normalized = path.resolve(dir, filename)
					if (modules[normalized] === undefined) {
						modules[normalized] = variable
						return resolve(path.dirname(dependency), exportCode(dependency, def, variable, eq))
					}
					else {
						if (modules[normalized] !== variable) {
							replacements.push({variable: variable, replacement: modules[normalized]})
						}
						return ""
					}
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

		function exportCode(file, def, variable, eq) {
			var declared = {}
			return fixCollisions(fs.readFileSync(file, "utf8"))
				.replace(/("|')use strict\1;?\s*/gm, "") // remove extraneous "use strict"
				.replace(/module\.exports\s*=\s*/gm, def + variable + eq)
				.replace(/module\.exports(\.|\[)/gm, function(match, token, length, code) {
					if (new RegExp("\\b" + variable + "\\b").test(variable) && !declared[variable]) {
						declared[variable] = true
						return def + variable + eq + "{}\n" + variable + token
					}
					return variable + token
				})
		}

		function fixCollisions(code) {
			for (var variable in usedVariables) {
				var collision = new RegExp("([^\\.])" + variable + "\\b(?![\"'`])", "g")
				var exported = new RegExp("module\\.exports\\s*=\\s*" + variable)
				if (collision.test(code) && !exported.test(code) && !globals[variable.match(/[^\.]+/)]) {
					var fixed = variable + usedVariables[variable]++
					code = code.replace(collision, "$1" + fixed)
				}
			}
			return code
		}

		function setVersion(code) {
			var metadata = JSON.parse(fs.readFileSync(__dirname + "/../package.json"))
			return code.replace("bleeding-edge", metadata.version)
		}

		function bundle(input, output) {
			console.log("bundling...")
			var code = setVersion(resolve(path.dirname(input), fs.readFileSync(input, "utf8")))
			if (new Function(code)) fs.writeFileSync(output, "new function() {\n" + code + "\n}", "utf8")
			console.log("done")
		}
		
		if (file !== output && file !== output.replace(/\.js$/, ".min.js")) bundle(input, output)
	}
	run()

	if (options && options.watch) {
		fs.watch(process.cwd(), {recursive: true}, function(type, file) {
			if (path.resolve(output) !== path.resolve(file)) run()
		})
	}
}
