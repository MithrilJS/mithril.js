"use strict"

const fs = require("fs")
const zlib = require("zlib")
const chokidar = require("chokidar")
const Terser = require("terser")
const util = require("util")

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const gzip = util.promisify(zlib.gzip)

const bundle = require("./_bundler-impl")

const aliases = {o: "output", m: "minify", w: "watch", s: "save"}
const params = Object.create(null)
let command
for (let arg of process.argv.slice(2)) {
	if (arg[0] === '"') arg = JSON.parse(arg)
	if (arg[0] === "-") {
		if (command != null) add(true)
		command = arg.replace(/\-+/g, "")
	}
	else if (command != null) add(arg)
	else params.input = arg
}
if (command != null) add(true)

function add(value) {
	params[aliases[command] || command] = value
	command = null
}

function format(n) {
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
}

async function build() {
	const original = await bundle(params.input)
	if (!params.minify) {
		await writeFile(params.output, original, "utf-8")
		return
	}
	console.log("minifying...")
	const minified = Terser.minify(original)
	if (minified.error) throw new Error(minified.error)
	await writeFile(params.output, minified.code, "utf-8")
	const originalSize = Buffer.byteLength(original, "utf-8")
	const compressedSize = Buffer.byteLength(minified.code, "utf-8")
	const originalGzipSize = (await gzip(original)).byteLength
	const compressedGzipSize = (await gzip(minified.code)).byteLength

	console.log("Original size: " + format(originalGzipSize) + " bytes gzipped (" + format(originalSize) + " bytes uncompressed)")
	console.log("Compiled size: " + format(compressedGzipSize) + " bytes gzipped (" + format(compressedSize) + " bytes uncompressed)")

	if (params.save) {
		const readme = await readFile("./README.md", "utf8")
		const kb = compressedGzipSize / 1000

		await writeFile("./README.md",
			readme.replace(
				/(<!-- size -->)(.+?)(<!-- \/size -->)/,
				"$1" + (kb % 1 ? kb.toFixed(2) : kb) + " KB$3"
			)
		)
	}
}

build()
if (params.watch) chokidar.watch(".", {ignored: params.output}).on("all", build)
