"use strict"

var fs = require("fs")
var UglifyES = require("uglify-es")

module.exports = function(input, output, options) {
	function minify(input, output) {
		var original = fs.readFileSync(input, "utf8"),
			uglified = UglifyES.minify(original),
			compressed = uglified.code

		if (compressed) {
			fs.writeFileSync(output, compressed, "utf8")
			return {original: original, compressed: compressed}
		}
		else if (uglified.error) console.log(uglified.error)
	}

	function run() {
		console.log("minifying...")
		return minify(input, output)
	}

	if (options && options.watch) fs.watchFile(input, run)

	return run() || null
}
