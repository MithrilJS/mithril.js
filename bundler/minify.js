"use strict"

var fs = require("fs")
var Terser = require("terser")

module.exports = function(filePath, options) {
	function minify(filePath) {
		var original = fs.readFileSync(filePath, "utf8"),
			uglified = Terser.minify(original),
			compressed = uglified.code

		if (uglified.error) throw new Error(uglified.error)

		fs.writeFileSync(filePath, compressed, "utf8")
		return {original: original, compressed: compressed}
	}

	function run() {
		console.log("minifying...")
		return minify(filePath)
	}

	if (options && options.watch) fs.watchFile(filePath, run)

	return run()
}
