import {fileURLToPath} from "node:url"
import fs from "node:fs/promises"
import {gzipSync} from "node:zlib"
import path from "node:path"

import {rollup} from "rollup"

import terser from "@rollup/plugin-terser"

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {Partial<Record<import("rollup").ModuleFormat, import("rollup").Plugin>>} */
const terserMinify = {
	iife: terser({
		compress: {passes: 3},
		format: {wrap_func_args: false},
		sourceMap: true,
	}),
	// See the comment in `src/core.js`
	esm: terser({
		compress: {passes: 3},
		format: {
			preserve_annotations: true,
			wrap_func_args: false,
		},
		sourceMap: true,
	}),
}

function format(n) {
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
}

/** @param {import("rollup").ModuleFormat} format */
async function build(name, format) {
	const bundle = await rollup({input: path.resolve(dirname, `../src/entry/${name}`)})

	try {
		await Promise.all([
			bundle.write({file: path.resolve(dirname, `../dist/${name}.js`), format, sourcemap: true}),
			bundle.write({file: path.resolve(dirname, `../dist/${name}.min.js`), format, plugins: [terserMinify[format]], sourcemap: true}),
		])
	} finally {
		await bundle.close()
	}
}

async function report(file) {
	const [original, minified] = await Promise.all([
		fs.readFile(path.resolve(dirname, `../dist/${file}.js`)),
		fs.readFile(path.resolve(dirname, `../dist/${file}.min.js`)),
	])
	const originalSize = original.length
	const compressedSize = minified.length
	const originalGzipSize = gzipSync(original).length
	const compressedGzipSize = gzipSync(minified).length

	console.log(`${file}.js:`)
	console.log(`    Original: ${format(originalGzipSize)} bytes gzipped (${format(originalSize)} bytes uncompressed)`)
	console.log(`    Minified: ${format(compressedGzipSize)} bytes gzipped (${format(compressedSize)} bytes uncompressed)`)
}

async function main() {
	await fs.rm(path.resolve(dirname, "../dist"), {recursive: true})

	await Promise.all([
		build("mithril.umd", "iife"),
		build("mithril.esm", "esm"),
		build("stream.umd", "iife"),
		build("stream.esm", "esm"),
	])

	await report("mithril.umd")
	await report("mithril.esm")
	await report("stream.umd")
	await report("stream.esm")
}

main()
