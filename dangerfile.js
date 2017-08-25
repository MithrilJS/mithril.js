/* global danger warn fail */
"use strict";

var fs = require("fs"),
	path = require("path"),

	locater = require("locater"),
	pinpoint = require("pinpoint"),
	dedent = require("dedent");

// Various views of changed/added files
var jsfiles = danger.git.created_files
		.concat(danger.git.modified_files)
		.filter((file) => path.extname(file) === ".js"),

	changelog = danger.git.modified_files.find((file) =>
		file === "docs/change-log.md"
	),

	appfiles = jsfiles.filter((file) =>
		file.indexOf("tests/") === -1
	);

function link(file, anchor, text) {
	var repo = danger.github.pr.head.repo.html_url,
		ref = danger.github.pr.head.ref;

	return danger.utils.href(`${repo}/blob/${ref}/${file}${anchor || ""}`, file || text);
}

// All PRs should be targeted against `next`
if(danger.github.pr.base.ref !== "next") {
	warn("PRs should be based on `next`, rebase before submitting please");
}

// Any non-test JS changes should probably have a change-log entry
if(appfiles.length && !changelog) {
	warn(dedent(`
		Please add an entry to ${link("docs/change-log.md")}.
	`))
}

// Call out if `o.only(...)` was left in
jsfiles
	.filter((file) => file.indexOf("tests/") > -1)
	// Have to exclude test-ospec.js because it specifically has a purposeful "o.only" in it
	.filter((file) => file.indexOf("test-ospec") === -1)
	.forEach((file) => {
		var code = fs.readFileSync(file, "utf8"),
			locs = locater.find("o.only", code);

		locs.forEach((loc) =>
			fail(dedent(`
				Please remove the \`o.only\` from ${link(file, `#L${loc.line}`)}.
				<pre lang="javascript">
				${pinpoint(code, {line: loc.line, column : loc.cursor})}
				</pre>
			`))
		)
	});
