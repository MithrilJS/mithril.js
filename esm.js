"use strict"

/*

This script will create esm compatible scripts
from the already compiled versions of:

- mithril.js > mithril.mjs
- mithril.min.js > mithril.min.mjs
- /stream/stream.js > stream.mjs

*/

var fs = require("fs")

var namedExports = [
	"m",
	"trust",
	"fragment",
	"mount",
	"route",
	"withAttr",
	"render",
	"redraw",
	"request",
	"jsonp",
	"parseQueryString",
	"buildQueryString",
	"version",
	"vnode",
	"PromisePolyfill"
]

var mithril = fs.readFileSync("mithril.js", "utf8")
fs.writeFileSync("mithril.mjs",
	mithril.slice(
		mithril.indexOf("\"use strict\"") + 13,
		mithril.lastIndexOf("if (typeof module")
	)
	+ "\nexport default m"
	// The exports are declared with prefixed underscores to avoid overwriting previously
	// declared variables with the same name
	+ "\nvar " + namedExports.map(function(n) { return "_" + n + " = m." + n }).join(",")
	+ "\nexport {" + namedExports.map(function(n) { return "_" + n + " as " + n }).join(",") + "}"
)

var mithrilMin = fs.readFileSync("mithril.min.js", "utf8")
var mName = mithrilMin.match(/window\.m=([a-z])}/)[1]
fs.writeFileSync("mithril.min.mjs",
	mithrilMin.slice(
		12,
		mithrilMin.lastIndexOf("\"undefined\"!==typeof module")
	)
	+ "export default " + mName + ";"
	// The exports are declared with prefixed underscores to avoid overwriting previously
	// declared variables with the same name
	+ "var " + namedExports.map(function(n) { return "_" + n + "=m." + n }).join(",") + ";"
	+ "export {" + namedExports.map(function(n) { return "_" + n + " as " + n }).join(",") + "};"
)

var stream = fs.readFileSync("stream/stream.js", "utf8")
fs.writeFileSync("stream/stream.mjs",
	stream.slice(
		stream.indexOf("\"use strict\"") + 13,
		stream.lastIndexOf("if (typeof module")
	)
	+ "\nexport default createStream"
)
