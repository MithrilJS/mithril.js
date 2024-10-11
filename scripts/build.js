import {fileURLToPath} from "node:url"
import fs from "node:fs/promises"
import {gzipSync} from "node:zlib"
import path from "node:path"

import {rollup} from "rollup"

import terser from "@rollup/plugin-terser"

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {{[key: import("rollup").ModuleFormat]: import("rollup").Plugin}} */
const terserPlugin = terser({
	compress: {passes: 3},
	sourceMap: true,
})

function format(n) {
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
}

/** @param {import("rollup").ModuleFormat} format */
async function build(name, format) {
	const bundle = await rollup({input: path.resolve(dirname, `../src/entry/${name}`)})

	try {
		await Promise.all([
			bundle.write({file: path.resolve(dirname, `../dist/${name}.js`), format, sourcemap: true}),
			bundle.write({file: path.resolve(dirname, `../dist/${name}.min.js`), format, plugins: [terserPlugin], sourcemap: true}),
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

	return compressedGzipSize
}

async function saveToReadme(size) {
	const readme = await fs.readFile(path.resolve(dirname, "../README.md"), "utf8")
	const kb = size / 1000

	await fs.writeFile(path.resolve(dirname, "../README.md"),
		readme.replace(
			/(<!--\s*size\s*-->)(.+?)(<!--\s*\/size\s*-->)/,
			`\$1${kb % 1 ? kb.toFixed(2) : kb} KB\$3`
		)
	)
}

async function main() {
	await fs.rm(path.resolve(dirname, "../dist"), {recursive: true})

	await Promise.all([
		build("mithril.umd", "iife"),
		build("mithril.esm", "esm"),
		build("stream.umd", "iife"),
		build("stream.esm", "esm"),
	])

	const mithrilSize = await report("mithril.umd")
	await report("mithril.esm")
	await report("stream.umd")
	await report("stream.esm")

	if (process.argv.includes("--save", 2)) await saveToReadme(mithrilSize)
}

main()
