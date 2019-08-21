#!/usr/bin/env node
"use strict"

// This is my temporary hack to simplify deployment until I fix the underlying
// problems in these bugs:
// - https://github.com/MithrilJS/mithril.js/issues/2417
// - https://github.com/MithrilJS/mithril.js/pull/2422
//
// Depending on the complexity, it might become permanent. It really isn't that
// helpful to create a release on Travis vs locally, aside from a couple extra
// potential 2FA prompts by npm during login and publish.

const path = require("path")
const {promises: fsp} = require("fs")
const readline = require("readline")
const {execFileSync} = require("child_process")
const {promisify} = require("util")
const rimraf = promisify(require("rimraf"))
const semver = require("semver")
const upstream = require("./_upstream")
const updateDocs = require("./update-docs")

// Fake it until it works with this.
upstream.fetch.remote = "origin"

function showHelp() {
	console.error(`
node scripts/release increment [ --preid id ] [ --publish ]

Invoke as 'scripts/release.sh' to invoke the release sequence, specifying the
version increment via 'increment' (required). Pass '--publish' to push the
change and publish it, instead of just logging the commands used to push the
release.

Here's how each increment type works:

- 'major' increments from 1.0.0 or 2.0.0-beta.0 to 2.0.0
- 'minor' increments from 1.0.0 to 1.1.0
- 'patch' increments from 1.0.0 to 1.0.1
- 'premajor' increments from 1.0.0 to 2.0.0-beta.0
- 'preminor' increments from 1.0.0 to 1.1.0-beta.0
- 'prepatch' increments from 1.0.0 to 1.0.1-beta.0
- 'prerelease' increments from 2.0.0-beta.0 to 2.0.0-beta.1

'--preid beta' specifies the 'beta' part above (default). It's required for all
'pre*' increment types except 'prerelease'.

See the docs for 'npm version' <https://docs.npmjs.com/cli/version> for details
on the 'increment' parameter.
`)
}

const rootDir = path.dirname(__dirname)
const p = (...args) => path.resolve(rootDir, ...args)

function fail(...args) {
	console.error(...args)
	return 1
}

function execCommand(cmd, args, opts) {
	console.error()
	console.error(["executing:", cmd, ...args].join(" "))
	return execFileSync(cmd, args, {
		windowsHide: true,
		stdio: "inherit",
		encoding: "utf-8",
		...opts,
	})
}

function git(...cmd) { return execCommand("git", cmd) }
function npm(...cmd) { return execCommand("npm", cmd) }
function npmConfig(key) { return npm("config", "get", key).trim() }

function getChanges() {
	return execCommand("git", ["status", "-z"], {
		stdio: ["inherit", "pipe", "inherit"],
	})
		.split(/\0/g)
		.filter((l) => (/\S/).test(l))
}

async function release({increment, preid, publish}) {
	if (!(/^prerelease$|^(pre)?(major|minor|patch)$/).test(increment)) {
		return fail(`Invalid increment: ${increment}`)
	}

	if ((/^pre(major|minor|patch)/).test(increment) && preid == null) {
		return fail(`'${increment}' must include a '--preid'`)
	}

	if (getChanges().length) {
		return fail("Tree must be clean to start!")
	}

	if (upstream.push == null) {
		return fail("You must have an upstream to push to!")
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	// Update local `master` and `next`.
	git("fetch", upstream.fetch.remote, "master", "next")

	// Make sure we're on the current `next` and merge any docs fixes and
	// similar that have landed in upstream `master`.
	git("checkout", "next")
	git("pull", "--rebase", upstream.fetch.remote, "next")
	git(
		"pull", "--allow-unrelated-histories",
		upstream.fetch.remote, "master"
	)

	// Note: we're doing our own semver incrementing.
	const packageJson = JSON.parse(
		await fsp.readFile(p("package.json"), "utf-8")
	)
	const version = semver.inc(packageJson.version, increment, preid)

	console.error(`
Copy the parts listed in "Upcoming" to a new section "### v${version}" in
docs/change-log.md and clear that section out. Also, add today's date under the
new section's heading to match the others and don't forget to update the table
of contents accordingly.
`)

	for (;;) {
		await new Promise((resolve) => rl.question(
			"Press <Enter> once ready to continue or Ctrl+C to abort.",
			// Ignore any input.
			() => resolve(),
		))

		// Verify the changelog was updated, and give a chance to retry if it's
		// prematurely continued.
		const changes = getChanges()
		const isChangelog = /^[ M][ M] docs\/change-log\.md$/
		const errors = []

		console.log("changes", changes)

		if (!changes.some((l) => isChangelog.test(l))) {
			errors.push("Changelog must be updated!")
		}

		if (changes.some((l) => !isChangelog.test(l))) {
			errors.push("Tree must not be otherwise dirty!")
		}

		if (!errors.length) break
		console.error(errors.join("\n"))
	}

	await rimraf(p("node_modules"))
	npm("install-test")
	npm("run", "build")
	console.log("*** Build done ***")

	// Update the package file.
	packageJson.version = version
	await fsp.writeFile(p("package.json"), "utf-8",
		JSON.stringify(packageJson, null, 2)
	)
	// Commit and tag the new release, with the appropriate CLI flag if the
	// commit needs signed.
	git("add", ".")
	git(
		"commit",
		...npmConfig("sign-git-tag") === "true" ? ["--gpg-sign"] : [],
		"--message", `v${version}`,
	)
	git("tag", `v${version}`)

	// Update `master` to reflect the current state of `next`.
	git("checkout", "master")
	git("reset", "--hard", "next")
	git("checkout", "next")

	if (publish) {
		// TODO: switch this to just do the push, and use the following Travis
		// config. This also conveniently keeps private stuff out of the build
		// scripts and just in build config, avoiding the grief that led to this
		// file's existence.
		//
		// ```yml
		// # See https://docs.travis-ci.com/user/deployment/npm/ for details on
		// # `api_key:` for the npm provider.
		// # See https://docs.travis-ci.com/user/deployment/pages/ for details
		// # on `github_token:` for the pages provider.
		// after_success: >
		//   [ "$TRAVIS_BRANCH" == "master" ] && node scripts/generate-docs
		//
		// deploy:
		//   - provider: npm
		//     skip_cleanup: true
		//     email: 'contact@isiahmeadows.com'
		//     api_key:
		//       secure: 'output of `travis encrypt NPM_AUTH_TOKEN`'
		//     on:
		//       tags: true
		//       condition: "$TRAVIS_TAG != *-*"
		//   - provider: npm
		//     skip_cleanup: true
		//     tag: next
		//     email: 'contact@isiahmeadows.com'
		//     api_key:
		//       secure: 'output of `travis encrypt NPM_AUTH_TOKEN`'
		//     on:
		//       tags: true
		//       condition: "$TRAVIS_TAG == *-*"
		//   - provider: pages
		//     skip_cleanup: true
		//     github_token:
		//       secure: 'output of `travis encrypt GITHUB_AUTH_TOKEN`'
		//     local_dir: dist
		//     fqdn: mithril.js.org
		//     committer_from_gh: true
		//     on:
		//       tags: false
		//       branch: master
		// ```
		npm("login")
		if (increment.startsWith("pre")) {
			npm("publish", "--tag", "next")
		} else {
			npm("publish")
		}
		npm("logout")

		// Only push after successful publish
		git(
			"push", "--atomic", "origin",
			"+next:master", "next:next", `next:refs/tags/v${version}`,
		)
		git(
			"push", "--atomic", upstream.push.remote,
			"+next:master", "next:next", `next:refs/tags/v${version}`,
		)
		await updateDocs()
	} else {
		const remote = upstream.push.remote
		console.error(`
npm login
npm publish${increment.startsWith("pre") ? " --tag next" : ""}
npm logout
git push --atomic origin +next:master next:next next:refs/tags/v${version}
git push --atomic ${remote} +next:master next:next next:refs/tags/v${version}
npm run release:docs
`)
	}

	console.error(`
Don't forget to update the latest release! You can find it here:
https://github.com/MithrilJS/mithril.js/releases/tag/v${version}
`)

	return 0
}

/* eslint-disable global-require */
if (require.main === module) {
	require("./_command")({async exec() {
		const parsed = require("minimist")(process.argv.slice(2), {
			boolean: ["help", "publish"],
			alias: {help: ["h", "?"]},
			string: ["preid"],
		})

		if (parsed.help || !parsed._.length) showHelp()
		else {
			await release({
				increment: parsed._[0],
				preid: parsed.preid,
				publish: parsed.publish,
			})
		}
	}})
}
