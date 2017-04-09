/* global danger, fail, warn */
"use strict";

var fs = require("fs"),
	path = require("path"),
	locater = require("locater")


var jsfiles = danger.git.created_files
		.concat(danger.git.modified_files)
		.filter((file) => path.extname(file) === ".js")

// Be careful of leaving testing shortcuts in the codebase
jsfiles
	.filter((file) => file.indexOf("test/") > -1)
	.forEach((file) => {
		var code = fs.readFileSync(file, "utf8"),
			locs = locater.find("o.only", code)

		locs.forEach((loc) =>
			fail(`${file} is prevent all tests from running ${loc.line}:${loc.cursor}`)
		)
	});
