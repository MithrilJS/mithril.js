#!/usr/bin/env node
/* eslint-disable no-process-exit */
"use strict"

process.on("unhandledRejection", (e) => {
	process.exitCode = 1

	if (!e.stdout || !e.stderr) throw e

	console.error(e.stack)

	if (e.stdout?.length) {
		console.error(e.stdout.toString("utf-8"))
	}

	if (e.stderr?.length) {
		console.error(e.stderr.toString("utf-8"))
	}

	// eslint-disable-next-line no-process-exit
	process.exit()
})

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
	const minified = await Terser.minify(original)
	if (minified.error) throw new Error(minified.error)
	await fs.writeFile(output, minified.code, "utf-8")
	const originalSize = Buffer.byteLength(original, "utf-8")
	const compressedSize = Buffer.byteLength(minified.code, "utf-8")
	const originalGzipSize = zlib.gzipSync(original).byteLength
	const compressedGzipSize = zlib.gzipSync(minified.code).byteLength

	console.log("Original size: " + format(originalGzipSize) + " bytes gzipped (" + format(originalSize) + " bytes uncompressed)")
	console.log("Compiled size: " + format(compressedGzipSize) + " bytes gzipped (" + format(compressedSize) + " bytes uncompressed)")
}

minify()
