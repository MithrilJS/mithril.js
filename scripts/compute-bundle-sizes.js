"use strict"

const fs = require("fs")
const path = require("path")
const zlib = require("zlib")

function format(n) {
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
}

const original = fs.readFileSync(path.resolve(__dirname, "../mithril.js"))
const compressed = fs.readFileSync(path.resolve(__dirname, "../mithril.min.js"))
const originalSize = original.byteLength
const compressedSize = compressed.byteLength
const originalGzipSize = zlib.gzipSync(original).byteLength
const compressedGzipSize = zlib.gzipSync(compressed).byteLength

console.log("Original size: " + format(originalGzipSize) + " bytes gzipped (" + format(originalSize) + " bytes uncompressed)")
console.log("Compiled size: " + format(compressedGzipSize) + " bytes gzipped (" + format(compressedSize) + " bytes uncompressed)")

if (process.argv.includes("--save", 2)) {
	const readme = fs.readFileSync("./README.md", "utf-8")
	const kb = compressedGzipSize / 1000

	fs.writeFileSync("./README.md",
		readme.replace(
			/<!-- size -->.+?<!-- \/size -->/,
			`<!-- size -->${kb % 1 ? kb.toFixed(2) : kb} KB<!-- /size -->`
		)
	)
}
