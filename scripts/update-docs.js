#!/usr/bin/env node
/* eslint-disable no-process-exit */
"use strict"

// This is my temporary hack to simplify deployment until I fix the underlying
// problems in these bugs:
// - https://github.com/MithrilJS/mithril.js/issues/2417
// - https://github.com/MithrilJS/mithril.js/pull/2422

const path = require("path")
const {execFileSync} = require("child_process")
const ghPages = require("gh-pages")
const upstream = require("./_upstream")
const generate = require("./generate-docs")

require("./_command")(module, () => update())
module.exports = update

async function update() {
	await generate()
	const commit = execFileSync("git", ["rev-parse", "--verify", "HEAD"], {
		windowsHide: true,
		stdio: "inherit",
		encoding: "utf-8",
	})

	await ghPages.publish(path.resolve(__dirname, "../dist"), {
		// Note: once this is running on Travis again, run
		// `git remote add upstream git@github.com:MithrilJS/mithril.js.git` to
		// force it to go over SSH so the saved keys are used.
		// https://github.com/tschaub/gh-pages/issues/160
		repo: upstream.push.repo,
		remote: upstream.push.branch,
		src: ["**/*", ".nojekyll"],
		message: `Generated docs for commit ${commit} [skip ci]`,
		// May want to enable this if an API token resolves the issue.
		// silent: !!process.env.TRAVIS_CI,
	})
}
