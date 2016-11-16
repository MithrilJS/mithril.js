"use strict"

var http = require("http")
var querystring = require("querystring")
var fs = require("fs")

module.exports = function(input, output, options, done) {
	function minify(input, output) {
		var code = fs.readFileSync(input, "utf8")

		var data = {
			output_format: "json",
			output_info: ["compiled_code", "warnings", "errors", "statistics"],
			compilation_level: options.advanced ? "ADVANCED_OPTIMIZATIONS" : "SIMPLE_OPTIMIZATIONS",
			warning_level: "default",
			output_file_name: "default.js",
			js_code: code,
		}

		var body = querystring.stringify(data)

		var response = ""
		var req = http.request({
			method: "POST",
			protocol: "http:",
			hostname: "closure-compiler.appspot.com",
			path: "/compile",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
				"Content-Length": body.length
			}
		}, function(res) {
			res.on("data", function(chunk) {
				response += chunk.toString()
			})
			res.on("end", function() {
				var results = JSON.parse(response)
				if (results.errors) {
					for (var i = 0; i < results.errors.length; i++) console.log(results.errors[i])
				}
				else {
					fs.writeFileSync(output, results.compiledCode, "utf8")

					console.log("done")

					if(typeof done === "function") done(results.statistics)
				}
			})
		})


		req.write(body)
		req.end()
		console.log("minifying...")
	}
	function run() {
		minify(input, output)
	}
	run()

	if (options && options.watch) fs.watchFile(input, run)
}
