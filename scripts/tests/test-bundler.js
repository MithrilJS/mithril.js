"use strict"

const fs = require("fs")
const util = require("util")
const access = util.promisify(fs.access)
const writeFile = util.promisify(fs.writeFile)
const unlink = util.promisify(fs.unlink)

const o = require("../../ospec/ospec")
const bundle = require("../_bundler-impl")

o.spec("bundler", async () => {
	let filesCreated
	const ns = "./"

	async function write(filepath, data) {
		try {
			await access(ns + filepath)
		} catch (e) {
			return writeFile(ns + filepath, data, "utf8")
		}
		throw new Error(`Don't call \`write('${filepath}')\`. Cannot overwrite file.`)
	}

	function setup(files) {
		filesCreated = Object.keys(files)
		return Promise.all(filesCreated.map((f) => write(f, files[f])))
	}

	o.afterEach(() => Promise.all(
		filesCreated.map((filepath) => unlink(ns + filepath))
	))

	o("relative imports works", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar b = 1\n}());")
	})
	o("relative imports works with semicolons", async () => {
		await setup({
			"a.js": 'var b = require("./b");',
			"b.js": "module.exports = 1;",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar b = 1;\n}());")
	})
	o("relative imports works with let", async () => {
		await setup({
			"a.js": 'let b = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nlet b = 1\n}());")
	})
	o("relative imports works with const", async () => {
		await setup({
			"a.js": 'const b = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nconst b = 1\n}());")
	})
	o("relative imports works with assignment", async () => {
		await setup({
			"a.js": 'var a = {}\na.b = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar a = {}\na.b = 1\n}());")
	})
	o("relative imports works with reassignment", async () => {
		await setup({
			"a.js": 'var b = {}\nb = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar b = {}\nb = 1\n}());")
	})
	o("relative imports removes extra use strict", async () => {
		await setup({
			"a.js": '"use strict"\nvar b = require("./b")',
			"b.js": '"use strict"\nmodule.exports = 1',
		})

		o(await bundle(ns + "a.js")).equals(';(function() {\n"use strict"\nvar b = 1\n}());')
	})
	o("relative imports removes extra use strict using single quotes", async () => {
		await setup({
			"a.js": "'use strict'\nvar b = require(\"./b\")",
			"b.js": "'use strict'\nmodule.exports = 1",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\n'use strict'\nvar b = 1\n}());")
	})
	o("relative imports removes extra use strict using mixed quotes", async () => {
		await setup({
			"a.js": '"use strict"\nvar b = require("./b")',
			"b.js": "'use strict'\nmodule.exports = 1",
		})

		o(await bundle(ns + "a.js")).equals(';(function() {\n"use strict"\nvar b = 1\n}());')
	})
	o("works w/ window", async () => {
		await setup({
			"a.js": 'window.a = 1\nvar b = require("./b")',
			"b.js": "module.exports = function() {return a}",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nwindow.a = 1\nvar b = function() {return a}\n}());")
	})
	o("works without assignment", async () => {
		await setup({
			"a.js": 'require("./b")',
			"b.js": "1 + 1",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\n1 + 1\n}());")
	})
	o("works if used fluently", async () => {
		await setup({
			"a.js": 'var b = require("./b").toString()',
			"b.js": "module.exports = []",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar _0 = []\nvar b = _0.toString()\n}());")
	})
	o("works if used fluently w/ multiline", async () => {
		await setup({
			"a.js": 'var b = require("./b")\n\t.toString()',
			"b.js": "module.exports = []",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar _0 = []\nvar b = _0\n\t.toString()\n}());")
	})
	o("works if used w/ curry", async () => {
		await setup({
			"a.js": 'var b = require("./b")()',
			"b.js": "module.exports = function() {}",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar _0 = function() {}\nvar b = _0()\n}());")
	})
	o("works if used w/ curry w/ multiline", async () => {
		await setup({
			"a.js": 'var b = require("./b")\n()',
			"b.js": "module.exports = function() {}",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar _0 = function() {}\nvar b = _0\n()\n}());")
	})
	o("works if used fluently in one place and not in another", async () => {
		await setup({
			"a.js": 'var b = require("./b").toString()\nvar c = require("./c")',
			"b.js": "module.exports = []",
			"c.js": 'var b = require("./b")\nmodule.exports = function() {return b}',
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar _0 = []\nvar b = _0.toString()\nvar b0 = _0\nvar c = function() {return b0}\n}());")
	})
	o("works if used in sequence", async () => {
		await setup({
			"a.js": 'var b = require("./b"), c = require("./c")',
			"b.js": "module.exports = 1",
			"c.js": "var x\nmodule.exports = 2",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar b = 1\nvar x\nvar c = 2\n}());")
	})
	o("works if assigned to property", async () => {
		await setup({
			"a.js": 'var x = {}\nx.b = require("./b")\nx.c = require("./c")',
			"b.js": "var bb = 1\nmodule.exports = bb",
			"c.js": "var cc = 2\nmodule.exports = cc",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar x = {}\nvar bb = 1\nx.b = bb\nvar cc = 2\nx.c = cc\n}());")
	})
	o("works if assigned to property using bracket notation", async () => {
		await setup({
			"a.js": 'var x = {}\nx["b"] = require("./b")\nx["c"] = require("./c")',
			"b.js": "var bb = 1\nmodule.exports = bb",
			"c.js": "var cc = 2\nmodule.exports = cc",
		})

		o(await bundle(ns + "a.js")).equals(';(function() {\nvar x = {}\nvar bb = 1\nx["b"] = bb\nvar cc = 2\nx["c"] = cc\n}());')
	})
	o("works if collision", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": "var b = 1\nmodule.exports = 2",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar b0 = 1\nvar b = 2\n}());")
	})
	o("works if multiple aliases", async () => {
		await setup({
			"a.js": 'var b = require("./b")\n',
			"b.js": 'var b = require("./c")\nb.x = 1\nmodule.exports = b',
			"c.js": "var b = {}\nmodule.exports = b",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar b = {}\nb.x = 1\n}());")
	})
	o("works if multiple collision", async () => {
		await setup({
			"a.js": 'var b = require("./b")\nvar c = require("./c")\nvar d = require("./d")',
			"b.js": "var a = 1\nmodule.exports = a",
			"c.js": "var a = 2\nmodule.exports = a",
			"d.js": "var a = 3\nmodule.exports = a",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = 2\nvar c = a0\nvar a1 = 3\nvar d = a1\n}());")
	})
	o("works if included multiple times", async () => {
		await setup({
			"a.js": "module.exports = 123",
			"b.js": 'var a = require("./a").toString()\nmodule.exports = a',
			"c.js": 'var a = require("./a").toString()\nvar b = require("./b")',
		})

		o(await bundle(ns + "c.js")).equals(";(function() {\nvar _0 = 123\nvar a = _0.toString()\nvar a0 = _0.toString()\nvar b = a0\n}());")
	})
	o("works if included multiple times reverse", async () => {
		await setup({
			"a.js": "module.exports = 123",
			"b.js": 'var a = require("./a").toString()\nmodule.exports = a',
			"c.js": 'var b = require("./b")\nvar a = require("./a").toString()',
		})

		o(await bundle(ns + "c.js")).equals(";(function() {\nvar _0 = 123\nvar a0 = _0.toString()\nvar b = a0\nvar a = _0.toString()\n}());")
	})
	o("reuses binding if possible", async () => {
		await setup({
			"a.js": 'var b = require("./b")\nvar c = require("./c")',
			"b.js": 'var d = require("./d")\nmodule.exports = function() {return d + 1}',
			"c.js": 'var d = require("./d")\nmodule.exports = function() {return d + 2}',
			"d.js": "module.exports = 1",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar d = 1\nvar b = function() {return d + 1}\nvar c = function() {return d + 2}\n}());")
	})
	o("disambiguates conflicts if imported collides with itself", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": "var b = 1\nmodule.exports = function() {return b}",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar b0 = 1\nvar b = function() {return b0}\n}());")
	})
	o("disambiguates conflicts if imported collides with something else", async () => {
		await setup({
			"a.js": 'var a = 1\nvar b = require("./b")',
			"b.js": "var a = 2\nmodule.exports = function() {return a}",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar a = 1\nvar a0 = 2\nvar b = function() {return a0}\n}());")
	})
	o("disambiguates conflicts if imported collides with function declaration", async () => {
		await setup({
			"a.js": 'function a() {}\nvar b = require("./b")',
			"b.js": "var a = 2\nmodule.exports = function() {return a}",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nfunction a() {}\nvar a0 = 2\nvar b = function() {return a0}\n}());")
	})
	o("disambiguates conflicts if imported collides with another module's private", async () => {
		await setup({
			"a.js": 'var b = require("./b")\nvar c = require("./c")',
			"b.js": "var a = 1\nmodule.exports = function() {return a}",
			"c.js": "var a = 2\nmodule.exports = function() {return a}",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar a = 1\nvar b = function() {return a}\nvar a0 = 2\nvar c = function() {return a0}\n}());")
	})
	o("does not mess up strings", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": 'var b = "b b b \\" b"\nmodule.exports = function() {return b}',
		})

		o(await bundle(ns + "a.js")).equals(';(function() {\nvar b0 = "b b b \\\" b"\nvar b = function() {return b0}\n}());')
	})
	o("does not mess up properties", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": "var b = {b: 1}\nmodule.exports = function() {return b.b}",
		})

		o(await bundle(ns + "a.js")).equals(";(function() {\nvar b0 = {b: 1}\nvar b = function() {return b0.b}\n}());")
	})
})
