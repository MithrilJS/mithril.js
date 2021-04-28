"use strict"

// Easier to deal with this system than to try to deal with a complicated config
// setup that'd amount to almost the same number of lines of code. It also means
// we can avoid a round trip with npm in the tests.
const path = require("path")
const {rollup} = require("rollup")
const commonjs = require("@rollup/plugin-commonjs")
const {nodeResolve} = require("@rollup/plugin-node-resolve")
const {terser} = require("rollup-plugin-terser")

const inputPlugins = [
	commonjs({
		transformMixedEsModules: true,
		requireReturnsDefault: true,
	}),
	nodeResolve(),
]

// Reuse the build cache across everything - help speed this up a little
let cache

async function build(target) {
	const bundle = await rollup({
		cache,
		input: path.resolve(__dirname, "../browser.js"),
		plugins: inputPlugins,
	})

	// ESLint's wrong here. It's safe.
	// eslint-disable-next-line require-atomic-updates
	cache = bundle.cache

	await bundle.write({
		file: path.resolve(__dirname, "..", target),
		format: "cjs",
		exports: "default",
		plugins: target.endsWith(".min.js") ? [terser()] : [],
	})

	await bundle.close()
}

async function main() {
	if (process.argv.includes("--test", 2)) {
		await build("temp/browser.js")
	} else {
		await build("mithril.js")
		await build("mithril.min.js")
	}
}

main()
