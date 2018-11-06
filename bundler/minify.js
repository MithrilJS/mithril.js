"use strict"

var fs = require("fs")
var UglifyES = require("uglify-es")

module.exports = function(filePath, options) {
	function minify(filePath) {
		var original = fs.readFileSync(filePath, "utf8"),
			uglified = UglifyES.minify(original),
			compressed = uglified.code

		if (compressed) {
			fs.writeFileSync(filePath, compressed, "utf8")
			return {original: original, compressed: compressed}
		}
		else if (uglified.error) {
			var msg = ""
			Object.keys(uglified.error).forEach(function(key){
				msg += "\n  " + key + ": " + uglified.error[key]
			})
			throw new Error(msg)
		}
	}

	function run() {
		console.log("minifying...")
		return minify(filePath)
	}

	if (options && options.watch) fs.watchFile(filePath, run)

	return run()
}
