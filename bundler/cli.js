"use strict"

var bundle = require("./bundle")
var minify = require("./minify")

var aliases = {o: "output"}
var params = {}
var args = process.argv.slice(2), command = null
console.log(args)
for (var i = 0; i < args.length; i++) {
	if (args[i][0] === '"') args[i] = args[i].slice(1, -1)
	if (args[i][0] === "-") command = args[i].replace(/\-+/g, "")
	else if (command != null) {
		params[aliases[command] || command] = args[i]
		command = null
	}
	else params.input = args[i]
}

bundle(params.input, params.output)
minify(params.output, params.output.replace(/\.js$/, ".min.js"))