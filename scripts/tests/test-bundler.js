"use strict"

const fs = require("fs")
const util = require("util")
const path = require("path")
const access = util.promisify(fs.access)
const writeFile = util.promisify(fs.writeFile)
const unlink = util.promisify(fs.unlink)

const o = require("ospec")
const bundle = require("../_bundler-impl")

o.spec("bundler", async () => {
	let filesCreated
	const root = path.resolve(__dirname, "../..")
	const p = (file) => path.join(root, file)

	async function write(filepath, data) {
		try {
			await access(p(filepath))
		} catch (e) {
			return writeFile(p(filepath), data, "utf8")
		}
		throw new Error(`Don't call \`write('${filepath}')\`. Cannot overwrite file.`)
	}

	function setup(files) {
		filesCreated = Object.keys(files)
		return Promise.all(filesCreated.map((f) => write(f, files[f])))
	}

	o.afterEach(() => Promise.all(
		filesCreated.map((filepath) => unlink(p(filepath)))
	))

	o("relative imports works", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar b = 1\n}());")
	})
	o("relative imports works with semicolons", async () => {
		await setup({
			"a.js": 'var b = require("./b");',
			"b.js": "module.exports = 1;",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar b = 1;\n}());")
	})
	o("relative imports works with let", async () => {
		await setup({
			"a.js": 'let b = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nlet b = 1\n}());")
	})
	o("relative imports works with const", async () => {
		await setup({
			"a.js": 'const b = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nconst b = 1\n}());")
	})
	o("relative imports works with assignment", async () => {
		await setup({
			"a.js": 'var a = {}\na.b = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar a = {}\na.b = 1\n}());")
	})
	o("relative imports works with reassignment", async () => {
		await setup({
			"a.js": 'var b = {}\nb = require("./b")',
			"b.js": "module.exports = 1",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar b = {}\nb = 1\n}());")
	})
	o("relative imports removes extra use strict", async () => {
		await setup({
			"a.js": '"use strict"\nvar b = require("./b")',
			"b.js": '"use strict"\nmodule.exports = 1',
		})

		o(await bundle(p("a.js"))).equals(';(function() {\n"use strict"\nvar b = 1\n}());')
	})
	o("relative imports removes extra use strict using single quotes", async () => {
		await setup({
			"a.js": "'use strict'\nvar b = require(\"./b\")",
			"b.js": "'use strict'\nmodule.exports = 1",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\n'use strict'\nvar b = 1\n}());")
	})
	o("relative imports removes extra use strict using mixed quotes", async () => {
		await setup({
			"a.js": '"use strict"\nvar b = require("./b")',
			"b.js": "'use strict'\nmodule.exports = 1",
		})

		o(await bundle(p("a.js"))).equals(';(function() {\n"use strict"\nvar b = 1\n}());')
	})
	o("works w/ window", async () => {
		await setup({
			"a.js": 'window.a = 1\nvar b = require("./b")',
			"b.js": "module.exports = function() {return a}",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nwindow.a = 1\nvar b = function() {return a}\n}());")
	})
	o("works without assignment", async () => {
		await setup({
			"a.js": 'require("./b")',
			"b.js": "1 + 1",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\n1 + 1\n}());")
	})
	o("works if used fluently", async () => {
		await setup({
			"a.js": 'var b = require("./b").toString()',
			"b.js": "module.exports = []",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar _0 = []\nvar b = _0.toString()\n}());")
	})
	o("works if used fluently w/ multiline", async () => {
		await setup({
			"a.js": 'var b = require("./b")\n\t.toString()',
			"b.js": "module.exports = []",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar _0 = []\nvar b = _0\n\t.toString()\n}());")
	})
	o("works if used w/ curry", async () => {
		await setup({
			"a.js": 'var b = require("./b")()',
			"b.js": "module.exports = function() {}",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar _0 = function() {}\nvar b = _0()\n}());")
	})
	o("works if used w/ curry w/ multiline", async () => {
		await setup({
			"a.js": 'var b = require("./b")\n()',
			"b.js": "module.exports = function() {}",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar _0 = function() {}\nvar b = _0\n()\n}());")
	})
	o("works if used fluently in one place and not in another", async () => {
		await setup({
			"a.js": 'var b = require("./b").toString()\nvar c = require("./c")',
			"b.js": "module.exports = []",
			"c.js": 'var b = require("./b")\nmodule.exports = function() {return b}',
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar _0 = []\nvar b = _0.toString()\nvar b0 = _0\nvar c = function() {return b0}\n}());")
	})
	o("works if used in sequence", async () => {
		await setup({
			"a.js": 'var b = require("./b"), c = require("./c")',
			"b.js": "module.exports = 1",
			"c.js": "var x\nmodule.exports = 2",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar b = 1\nvar x\nvar c = 2\n}());")
	})
	o("works if assigned to property", async () => {
		await setup({
			"a.js": 'var x = {}\nx.b = require("./b")\nx.c = require("./c")',
			"b.js": "var bb = 1\nmodule.exports = bb",
			"c.js": "var cc = 2\nmodule.exports = cc",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar x = {}\nvar bb = 1\nx.b = bb\nvar cc = 2\nx.c = cc\n}());")
	})
	o("works if assigned to property using bracket notation", async () => {
		await setup({
			"a.js": 'var x = {}\nx["b"] = require("./b")\nx["c"] = require("./c")',
			"b.js": "var bb = 1\nmodule.exports = bb",
			"c.js": "var cc = 2\nmodule.exports = cc",
		})

		o(await bundle(p("a.js"))).equals(';(function() {\nvar x = {}\nvar bb = 1\nx["b"] = bb\nvar cc = 2\nx["c"] = cc\n}());')
	})
	o("works if collision", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": "var b = 1\nmodule.exports = 2",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar b0 = 1\nvar b = 2\n}());")
	})
	o("works if multiple aliases", async () => {
		await setup({
			"a.js": 'var b = require("./b")\n',
			"b.js": 'var b = require("./c")\nb.x = 1\nmodule.exports = b',
			"c.js": "var b = {}\nmodule.exports = b",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar b = {}\nb.x = 1\n}());")
	})
	o("works if multiple collision", async () => {
		await setup({
			"a.js": 'var b = require("./b")\nvar c = require("./c")\nvar d = require("./d")',
			"b.js": "var a = 1\nmodule.exports = a",
			"c.js": "var a = 2\nmodule.exports = a",
			"d.js": "var a = 3\nmodule.exports = a",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = 2\nvar c = a0\nvar a1 = 3\nvar d = a1\n}());")
	})
	o("works if included multiple times", async () => {
		await setup({
			"a.js": "module.exports = 123",
			"b.js": 'var a = require("./a").toString()\nmodule.exports = a',
			"c.js": 'var a = require("./a").toString()\nvar b = require("./b")',
		})

		o(await bundle(p("c.js"))).equals(";(function() {\nvar _0 = 123\nvar a = _0.toString()\nvar a0 = _0.toString()\nvar b = a0\n}());")
	})
	o("works if included multiple times reverse", async () => {
		await setup({
			"a.js": "module.exports = 123",
			"b.js": 'var a = require("./a").toString()\nmodule.exports = a',
			"c.js": 'var b = require("./b")\nvar a = require("./a").toString()',
		})

		o(await bundle(p("c.js"))).equals(";(function() {\nvar _0 = 123\nvar a0 = _0.toString()\nvar b = a0\nvar a = _0.toString()\n}());")
	})
	o("reuses binding if possible", async () => {
		await setup({
			"a.js": 'var b = require("./b")\nvar c = require("./c")',
			"b.js": 'var d = require("./d")\nmodule.exports = function() {return d + 1}',
			"c.js": 'var d = require("./d")\nmodule.exports = function() {return d + 2}',
			"d.js": "module.exports = 1",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar d = 1\nvar b = function() {return d + 1}\nvar c = function() {return d + 2}\n}());")
	})
	o("disambiguates conflicts if imported collides with itself", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": "var b = 1\nmodule.exports = function() {return b}",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar b0 = 1\nvar b = function() {return b0}\n}());")
	})
	o("disambiguates conflicts if imported collides with something else", async () => {
		await setup({
			"a.js": 'var a = 1\nvar b = require("./b")',
			"b.js": "var a = 2\nmodule.exports = function() {return a}",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar a0 = 2\nvar b = function() {return a0}\n}());")
	})
	o("disambiguates conflicts if imported collides with function declaration", async () => {
		await setup({
			"a.js": 'function a() {}\nvar b = require("./b")',
			"b.js": "var a = 2\nmodule.exports = function() {return a}",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nfunction a() {}\nvar a0 = 2\nvar b = function() {return a0}\n}());")
	})
	o("disambiguates conflicts if imported collides with another module's private", async () => {
		await setup({
			"a.js": 'var b = require("./b")\nvar c = require("./c")',
			"b.js": "var a = 1\nmodule.exports = function() {return a}",
			"c.js": "var a = 2\nmodule.exports = function() {return a}",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = function() {return a}\nvar a0 = 2\nvar c = function() {return a0}\n}());")
	})
	o("does not mess up strings", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": 'var b = "b b b \\" b"\nmodule.exports = function() {return b}',
		})

		o(await bundle(p("a.js"))).equals(';(function() {\nvar b0 = "b b b \\\" b"\nvar b = function() {return b0}\n}());')
	})
	o("does not mess up properties", async () => {
		await setup({
			"a.js": 'var b = require("./b")',
			"b.js": "var b = {b: 1}\nmodule.exports = function() {return b.b}",
		})

		o(await bundle(p("a.js"))).equals(";(function() {\nvar b0 = {b: 1}\nvar b = function() {return b0.b}\n}());")
	})
	o.spec("fix comments", () => {
		o("fix /* */ comments", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = 2\n/* a */\nmodule.exports = a",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = 2\n/* a */\nvar c = a0\n}());")
		})
		o("fix // comments", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = 2\n// a\nmodule.exports = a",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = 2\n// a\nvar c = a0\n}());")
		})
		o("fix multi-line /* */ comments", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = 2\n/* \na */\nmodule.exports = a",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = 2\n/* \na */\nvar c = a0\n}());")
		})
		o("does not fix trailing /* */ comments", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = 2/* a */\nmodule.exports = a",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = 2/* a0 */\nvar c = a0\n}());")
		})
		o("does not fix trailing // comments", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = 2// a\nmodule.exports = a",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = 2// a0\nvar c = a0\n}());")
		})
		o("does not fix trailing multi-line /* */ comments", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = 2/* \na */\nmodule.exports = a",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = 2/* \na0 */\nvar c = a0\n}());")
		})
	})
	o("prevents double suffixes (mountRedraw00)", async () => {
		await setup({
			// /index.js (request(b), mount-redraw(z), route(c))
			"a.js": 'var b = require("./b")\nvar z = require("./z")\nvar c = require("./c")',
			// /request.js
			"b.js": 'var z = require("./z")\nmodule.exports = require("./p")(z)',
			// /route.js
			"c.js": 'var z = require("./z")\nmodule.exports = require("./q")(z)',
			// /request/request.js
			"p.js": "module.exports = function(z){}",
			// /api/router.js
			"q.js": "module.exports = function(z){}",
			// /mount-redraw.js
			"z.js": "module.exports = {}",
		})

		// check that the argument z2 is not z00
		o(await bundle(p("a.js"))).equals(";(function() {\nvar z0 = {}\nvar _1 = function(z1){}\nvar b = _1(z0)\nvar z = z0\nvar _5 = function(z2){}\nvar c = _5(z)\n}());")
	})
	o.spec("spread syntax and destructuring (...)", () => {
		o("rest parameter", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "function f(d, ...a){}\nmodule.exports = f",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nfunction f(d, ...a0){}\nvar c = f\n}());")
		})
		o("function call", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = [1, 2, 3]\nvar d = f(...a)\nmodule.exports = d",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = [1, 2, 3]\nvar d = f(...a0)\nvar c = d\n}());")
		})
		o("new", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = [1, 2, 3]\nvar d = new f(...a)\nmodule.exports = d",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = [1, 2, 3]\nvar d = new f(...a0)\nvar c = d\n}());")
		})
		o("array spread", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = [1, 2, 3]\nvar arr = [...a]\nmodule.exports = arr",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = [1, 2, 3]\nvar arr = [...a0]\nvar c = arr\n}());")
		})
		o("array spread (merge)", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = [1, 2, 3]\nvar arr = [0, ...a, 4]\nmodule.exports = arr",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = [1, 2, 3]\nvar arr = [0, ...a0, 4]\nvar c = arr\n}());")
		})
		o("array destructuring", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = [1, 2, 3]\nvar d\n[d, ...a] = a\nmodule.exports = a",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = [1, 2, 3]\nvar d\n[d, ...a0] = a0\nvar c = a0\n}());")
		})
		o("object spread", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = { p: 1, q: 2, r: 3 }\nvar d = {...a}\nmodule.exports = d",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = { p: 1, q: 2, r: 3 }\nvar d = {...a0}\nvar c = d\n}());")
		})
		o("object spread (merge)", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var a = { p: 1, q: 2, r: 3 }\nvar d = {o:0,...a}\nmodule.exports = d",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar a0 = { p: 1, q: 2, r: 3 }\nvar d = {o:0,...a0}\nvar c = d\n}());")
		})
		o("object destructuring", async () => {
			await setup({
				"a.js": 'var b = require("./b")\nvar c = require("./c")',
				"b.js": "var a = 1\nmodule.exports = a",
				"c.js": "var obj = { p: 1, q: 2, r: 3 }\nvar p,a\n({p,...a}=obj)\nmodule.exports = a",
			})

			o(await bundle(p("a.js"))).equals(";(function() {\nvar a = 1\nvar b = a\nvar obj = { p: 1, q: 2, r: 3 }\nvar p,a0\n({p,...a0}=obj)\nvar c = a0\n}());")
		})
	})
})
