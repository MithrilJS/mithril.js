"use strict"

const fs = require("fs")
const version = require("../package.json").version
const index = require.resolve("../index")

fs.writeFile(index,
	fs.readFile(index, "utf-8")
		.replace(/(version\s*=\s*)(['"]).*?\2/, `$1$2${version}$2`)
)
