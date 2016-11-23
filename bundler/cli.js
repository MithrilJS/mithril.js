"use strict"

var fs = require("fs");

var bundle = require("./bundle")
var minify = require("./minify")

var aliases = {o: "output", m: "minify", w: "watch", a: "aggressive"}
var params = {}
var args = process.argv.slice(2), command = null
for (var i = 0; i < args.length; i++) {
	if (args[i][0] === '"') args[i] = JSON.parse(args[i])
	if (args[i][0] === "-") {
		if (command != null) add(true)
		command = args[i].replace(/\-+/g, "")
	}
	else if (command != null) add(args[i])
	else params.input = args[i]
}
if (command != null) add(true)

function add(value) {
	params[aliases[command] || command] = value
	command = null
}

bundle(params.input, params.output, {watch: params.watch})
if (params.minify) {
	minify(params.output, params.output, {watch: params.watch, advanced: params.aggressive}, function(stats) {
		var readme, name;

		function format(n) {
			return (n / 1024).toFixed(2) + " KB"
		}

		console.log("Original size for " + params.output + ": " + format(stats.originalGzipSize) + " gzipped (" + format(stats.originalSize) + " uncompressed)")
		console.log("Compiled size for " + params.output + ": " + format(stats.compressedGzipSize) + " gzipped (" + format(stats.compressedSize) + " uncompressed)")

		readme = fs.readFileSync("./README.md", "utf8")
		name = params.minify === true ? "" : "-" + params.minify

		fs.writeFileSync("./README.md",
			readme.replace(
				new RegExp("(<!-- size" + name + " -->).+?(<!-- /size -->)"),
				"$1" + format(stats.compressedGzipSize) + "$2"
			)
		)
	})
}
