/* eslint-disable */
"use strict";

var fs   = require("fs"),
	path = require("path"),

	locater  = require("locater"),
	pinpoint = require("pinpoint"),
	dedent  = require("dedent"),

	jsfiles = danger.git.created_files
		.concat(danger.git.modified_files)
		.filter((file) => path.extname(file) === ".js");

function link(file, anchor) {
	var repo = danger.github.pr.head.repo.html_url,
		ref = danger.github.pr.head.ref;

	return danger.utils.href(`${repo}/blob/${ref}/${file}${anchor || ""}`, file);
}

// Every JS file should start with "use strict";
jsfiles
	.forEach((file) => {
		var loc = fs.readFileSync(file, "utf8").indexOf(`"use strict";`);

		if(loc === 0) {
			return;
		}

		warn(`${link(file, "#L1")} does not declare strict mode immediately`);
	});

// Be careful of leaving testing shortcuts in the codebase
jsfiles
	.filter((file) => file.indexOf("test") > -1)
	.forEach(file => {
		var code = fs.readFileSync(file, "utf8"),
			locs = locater.find("o.only", code);

		locs.forEach((loc) =>
			fail(dedent(`
				${link(file, `#L${loc.line}`)} is preventing tests from running.
				<pre lang="javascript">
				${pinpoint(code, { line: loc.line, column : loc.cursor })}
				</pre>
			`))
		)
	});
