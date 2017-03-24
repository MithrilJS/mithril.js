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
		var readme, kb;

		function format(n) {
			return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
		}

		console.log("Original size: " + format(stats.originalGzipSize) + " bytes gzipped (" + format(stats.originalSize) + " bytes uncompressed)")
		console.log("Compiled size: " + format(stats.compressedGzipSize) + " bytes gzipped (" + format(stats.compressedSize) + " bytes uncompressed)")

		readme = fs.readFileSync("./README.md", "utf8")
		kb = stats.compressedGzipSize / 1024

		fs.writeFileSync("./README.md",
			readme.replace(
				/(<!-- size -->)(.+?)(<!-- \/size -->)/,
				"$1" + (kb % 1 ? kb.toFixed(2) : kb) + " KB$3"
			)
		)
	})
}
