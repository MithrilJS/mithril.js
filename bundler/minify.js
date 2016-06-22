var http = require("http")
var querystring = require("querystring")
var fs = require("fs")

var code = fs.readFileSync("./mithril.js", "utf8")

var data = {
	output_format: "json",
	output_info: ["compiled_code", "warnings", "errors", "statistics"],
	compilation_level: "SIMPLE_OPTIMIZATIONS",//ADVANDED_OPTIMIZATIONS
	warning_level: "default",
	output_file_name: "default.js",
	js_code: code,
}

var body = querystring.stringify(data)

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
		var stats = results.statistics
		console.log("Original size: " + format(stats.originalGzipSize) + " bytes gzipped (" + format(stats.originalSize) + " bytes uncompressed)")
		console.log("Compiled size: " + format(stats.compressedGzipSize) + " bytes gzipped (" + format(stats.compressedSize) + " bytes uncompressed)")
		
		fs.writeFileSync("mithril.min.js", results.compiledCode, "utf8")
	})
})

var response = ""

req.write(body)
req.end()
console.log("compiling...")

function format(n) {
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
}