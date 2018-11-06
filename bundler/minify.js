"use strict"

var fs = require("fs")
var UglifyES = require("uglify-es")

module.exports = function(inputPath, outputPath, options) {
	function minify(inputPath, outputPath) {
		var original = fs.readFileSync(inputPath, "utf8"),
			uglified = UglifyES.minify(original),
			compressed = uglified.code

		if (compressed) {
			fs.writeFileSync(outputPath, compressed, "utf8")
			return {original: original, compressed: compressed}
		}
		else if (uglified.error) console.log(uglified.error)
	}

	function run() {
		console.log("minifying...")
		return minify(inputPath, outputPath)
	}

	if (options && options.watch) fs.watchFile(inputPath, run)

	return run() || null
}
