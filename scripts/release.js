#!/usr/bin/env node
/* eslint-disable no-process-exit */
"use strict"

// This is my temporary hack to simplify deployment until I fix the underlying
// problems in these bugs:
// - https://github.com/MithrilJS/mithril.js/issues/2417
// - https://github.com/MithrilJS/mithril.js/pull/2422
//
// Depending on the complexity, it might become permanent. It really isn't that
// helpful to create a release on Travis vs locally, aside from a couple extra
// potential 2FA prompts by npm during login and publish.

if (require.main !== module) {
	throw new Error("This is a script, not a module!")
}

const path = require("path")
const fs = require("fs")
const {execFileSync} = require("child_process")
const rimraf = require("rimraf")

function showHelp() {
	console.error(`
scripts/release.sh increment [ --preid id ]

Invoke as \`scripts/release.sh\` to invoke the release sequence, specifying the
version increment via \`increment\` (required). Here's how they all work:

- \`major\` increments from 1.0.0 or 2.0.0-beta.0 to 2.0.0
- \`minor\` increments from 1.0.0 to 1.1.0
- \`patch\` increments from 1.0.0 to 1.0.1
- \`premajor\` increments from 1.0.0 to 2.0.0-beta.0
- \`preminor\` increments from 1.0.0 to 1.1.0-beta.0
- \`prepatch\` increments from 1.0.0 to 1.0.1-beta.0
- \`prerelease\` increments from 2.0.0-beta.0 to 2.0.0-beta.1

\`--preid beta\` specifies the \`beta\` part above (default). It's required for
all \`pre*\` increment types except \`prerelease\`.

See the docs for \`npm version\` <https://docs.npmjs.com/cli/version> for
details on the \`increment\` parameter.
`.trim())
	process.exit(0)
}

function bail(...args) {
	console.error(...args)
	process.exit(1)
}

const rootDir = path.dirname(__dirname)
const p = (...args) => path.resolve(rootDir, ...args)

function readVersion() {
	return JSON.parse(fs.readFileSync(p("../package.json"), "utf-8")).version
}

const parsed = require("minimist")(process.argv.slice(2), {
	boolean: ["help"],
	alias: {help: ["h", "?"]},
	string: ["preid"],
	"--": true,
})

if (parsed.help || !parsed["--"].length) showHelp()
const publishType = parsed["--"][0]
const publishPreid = parsed.preid
const publishArgs = publishType.startsWith("pre") ? ["--tag", "next"] : []
let releaseArgs = []

if (publishType.startsWith("pre") && publishType !== "prerelease") {
	if (publishPreid == null) {
		bail("`pre*` increments other than `prerelease` require `--preid`")
	}
	releaseArgs = [`--preid=${publishPreid}`]
}

function exec(cmd, args, opts) {
	return execFileSync(name, args, {
		windowsHide: true,
		stdio: "inherit",
		encoding: "utf-8",
		...opts,
	})
}

const upstream = require("./_upstream")

exec("git", ["checkout", "next"])
exec("git", ["pull", "--rebase", upstream.fetch.branch, "next"])

// Because I'm too lazy to make everything async.
exec("read", ["-rsp", `
Update "Upcoming" in \`docs/change-log.md\`. If moving a prerelease to stable,
also replace all references to \`mithril@next\` to \`mithril\`, including in
Flems snippets. Press enter once ready to continue.
`.trim()], {shell: true})

// Verify the changelog was updated
let changelogUpdated = false
let treeDirty = false

for (const line of exec("git", ["status", "-z"]).split(/\0/g)) {
	switch (line) {
		case " M CHANGELOG.md":
		case "M  CHANGELOG.md":
		case "MM CHANGELOG.md":
			changelogUpdated = true
			break

		default:
			treeDirty = true
	}
}

if (!changelogUpdated || treeDirty) {
	if (!changelogUpdated) console.error("Error: Changelog must be updated!")
	if (!treeDirty) console.error("Error: Tree must not be otherwise dirty!")
	process.exit(1)
}

exec("git", ["add", "."])
exec("git", ["commit", "-m", "Preparing for release"])

exec("git", ["checkout", "master"])
exec("git", ["pull", "--rebase", upstream.fetch.branch, "master"])
// There may be merge conflicts with `index.js` and/or the bundle - just ignore
// them. Whatever they have is canon, as is the case with everything else.
exec("git", ["merge", "next", "-s", "theirs"])
rimraf.sync(p("node_modules"))
exec("npm", ["install-test"])

exec("npm", ["version", "-m", "v%s", publishType, ...releaseArgs])

exec("git", ["push", "--follow-tags", "origin", "master"])
exec("git", ["push", "--follow-tags", upstream.push.branch, "master"])

exec("git", ["checkout", "next"])
exec("git", ["checkout", "master", "--", "mithril.js", "mithril.min.js"])
// That's already been updated in `master`.
exec("git", ["commit", "-m", `Generated bundles for ${readVersion()} [skip ci]`])

exec("git", ["push"])
exec("git", ["push", upstream.push.branch, "next"])

exec("git", ["checkout", "master"])

exec("npm", ["login"])
exec("npm", ["publish", ...publishArgs])
exec("npm", ["logout"])

require("./update-docs")()
