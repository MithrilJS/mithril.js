"use strict"

var fs = require("fs")
var zlib = require("zlib")
var UglifyES = require("uglify-es")

module.exports = function(input, output, options, done) {
	function minify(input, output) {
		var code = fs.readFileSync(input, "utf8")

		try {
			var uglified = UglifyES.minify(code)
			var minifiedCode = uglified.code

			if (minifiedCode) {
				fs.writeFileSync(output, minifiedCode, "utf8")
				console.log("done")

				if (typeof done === "function") {
					var originalGzip = zlib.gzipSync(code),
						compressedGzip = zlib.gzipSync(minifiedCode)

					// CLI expects these 4 props
					done({
						originalSize: code.length,
						compressedSize: fs.statSync(output).size,
						originalGzipSize: originalGzip.byteLength,
						compressedGzipSize: compressedGzip.byteLength,
					})
				}
			}
			else if (uglified.error) console.log(uglified.error)
		} catch (e) {
			console.error(e)
		}
	}
	function run() {
		console.log("minifying...")
		minify(input, output)
	}
	run()

	if (options && options.watch) fs.watchFile(input, run)
}
