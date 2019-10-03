#!/usr/bin/env node
/* eslint-disable no-process-exit */
"use strict"

// This is my temporary hack to simplify deployment until I fix the underlying
// problems in these bugs:
// - https://github.com/MithrilJS/mithril.js/issues/2417
// - https://github.com/MithrilJS/mithril.js/pull/2422

const {promises: fs} = require("fs")
const path = require("path")
const zlib = require("zlib")
const Terser = require("terser")

function format(n) {
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
}

module.exports = minify
async function minify() {
	const input = path.resolve(__dirname, "../stream/stream.js")
	const output = path.resolve(__dirname, "../stream/stream.min.js")
	const original = await fs.readFile(input, "utf-8")
	const minified = Terser.minify(original)
	if (minified.error) throw new Error(minified.error)
	await fs.writeFile(output, minified.code, "utf-8")
	const originalSize = Buffer.byteLength(original, "utf-8")
	const compressedSize = Buffer.byteLength(minified.code, "utf-8")
	const originalGzipSize = zlib.gzipSync(original).byteLength
	const compressedGzipSize = zlib.gzipSync(minified.code).byteLength

	console.log("Original size: " + format(originalGzipSize) + " bytes gzipped (" + format(originalSize) + " bytes uncompressed)")
	console.log("Compiled size: " + format(compressedGzipSize) + " bytes gzipped (" + format(compressedSize) + " bytes uncompressed)")
}

/* eslint-disable global-require */
if (require.main === module) {
	require("./_command")({exec: minify})
}
