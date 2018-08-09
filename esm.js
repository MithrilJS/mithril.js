"use strict"

/*

This script will create esm compatible scripts
from the already compiled versions of:

- mithril.js > mithril.esm.js
- mithril.min.js > mithril.min.esm.js
- /stream/stream.js > stream.esm.js

*/

var fs = require("fs")

var mithril = fs.readFileSync("mithril.js", "utf8")
fs.writeFileSync("mithril.esm.js",
	mithril.slice(
		mithril.indexOf("\"use strict\"") + 13,
		mithril.lastIndexOf("if (typeof module")
	)
	+ "\nexport default m"
)

var mithrilMin = fs.readFileSync("mithril.min.js", "utf8")
var mName = mithrilMin.match(/window\.m=([a-z])}/)[1]
fs.writeFileSync("mithril.min.esm.js",
	mithrilMin.slice(
		12,
		mithrilMin.lastIndexOf("\"undefined\"!==typeof module")
	)
	+ "export default " + mName + ";"
)

var stream = fs.readFileSync("stream/stream.js", "utf8")
fs.writeFileSync("stream/stream.esm.js",
	stream.slice(
		stream.indexOf("\"use strict\"") + 13,
		stream.lastIndexOf("if (typeof module")
	)
	+ "\nexport default createStream"
)
