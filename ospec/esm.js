"use strict"

/*

This script will create an esm compatible script
from the already compiled version of:

- ospec.js > ospec.esm.js

*/

var fs = require("fs")

var ospec = fs.readFileSync("ospec.js", "utf8")
fs.writeFileSync("ospec.esm.js",
	"export default "
	+ ospec.slice(ospec.indexOf("})") + 2)
	+ "()"
)
