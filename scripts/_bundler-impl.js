"use strict"

const fs = require("fs")
const path = require("path")
const execFileSync = require("child_process").execFileSync
const util = require("util")

const readFile = util.promisify(fs.readFile)
const access = util.promisify(fs.access)

function isFile(filepath) {
	return access(filepath).then(() => true, () => false)
}
function escapeRegExp(string) {
	return string.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&")
}
function escapeReplace(string) {
	return string.replace(/\$/g, "\\$&")
}

async function resolve(filepath, filename) {
	if (filename[0] !== ".") {
		// resolve as npm dependency
		const packagePath = `./node_modules/${filename}/package.json`
		let json, meta

		try {
			json = await readFile(packagePath, "utf8")
		} catch (e) {
			meta = {}
		}

		if (json) {
			try {
				meta = JSON.parse(json)
			}
			catch (e) {
				throw new Error(`invalid JSON for ${packagePath}: ${json}`)
			}
		}

		const main = `./node_modules/${filename}/${meta.main || `${filename}.js`}`
		return path.resolve(await isFile(main) ? main : `./node_modules/${filename}/index.js`)
	}
	else {
		// resolve as local dependency
		return path.resolve(path.dirname(filepath), filename + ".js")
	}
}

function matchAll(str, regexp) {
	regexp.lastIndex = 0
	const result = []
	let exec
	while ((exec = regexp.exec(str)) != null) result.push(exec)
	return result
}

let error
module.exports = async (input) => {
	const modules = new Map()
	const bindings = new Map()
	const declaration = /^\s*(?:var|let|const|function)[\t ]+([\w_$]+)/gm
	const include = /(?:((?:var|let|const|,|)[\t ]*)([\w_$\.\[\]"'`]+)(\s*=\s*))?require\(([^\)]+)\)(\s*[`\.\(\[])?/gm
	let uuid = 0
	async function process(filepath, data) {
		for (const [, binding] of matchAll(data, declaration)) bindings.set(binding, 0)

		const tasks = []

		for (const [, def = "", variable = "", eq = "", dep, rest = ""] of matchAll(data, include)) {
			tasks.push({filename: JSON.parse(dep), def, variable, eq, rest})
		}

		const imports = await Promise.all(
			tasks.map((t) => resolve(filepath, t.filename))
		)

		const results = []
		for (const [i, task] of tasks.entries()) {
			const dependency = imports[i]
			let pre = "", def = task.def
			if (def[0] === ",") def = "\nvar ", pre = "\n"
			const localUUID = uuid // global uuid can update from nested `process` call, ensure same id is used on declaration and consumption
			const existingModule = modules.get(dependency)
			modules.set(dependency, task.rest ? `_${localUUID}` : task.variable)
			const code = await process(
				dependency,
				pre + (
					existingModule == null
						? await exportCode(task.filename, dependency, def, task.variable, task.eq, task.rest, localUUID)
						: def + task.variable + task.eq + existingModule
				)
			)
			uuid++
			results.push(code + task.rest)
		}

		let i = 0
		return data.replace(include, () => results[i++])
	}

	async function exportCode(filename, filepath, def, variable, eq, rest, uuid) {
		let code = await readFile(filepath, "utf-8")
		// if there's a syntax error, report w/ proper stack trace
		try {
			new Function(code)
		}
		catch (e) {
			try {
				execFileSync("node", ["--check", filepath], {
					stdio: "pipe",
				})
			}
			catch (e) {
				if (e.message !== error) {
					error = e.message
					console.log(`\x1b[31m${e.message}\x1b[0m`)
				}
			}
		}

		// disambiguate collisions
		const targetPromises = []
		code.replace(include, (match, def, variable, eq, dep) => {
			targetPromises.push(resolve(filepath, JSON.parse(dep)))
		})

		const ignoredTargets = await Promise.all(targetPromises)
		const ignored = new Set()

		for (const target of ignoredTargets) {
			const binding = modules.get(target)
			if (binding != null) ignored.add(binding)
		}

		if (new RegExp(`module\\.exports\\s*=\\s*${variable}\s*$`, "m").test(code)) ignored.add(variable)
		for (const [binding, count] of bindings) {
			if (!ignored.has(binding)) {
				const before = code
				code = code.replace(
					new RegExp(`(\\b)${escapeRegExp(binding)}\\b`, "g"),
					escapeReplace(binding) + count
				)
				if (before !== code) bindings.set(binding, count + 1)
			}
		}

		// fix strings that got mangled by collision disambiguation
		const string = /(["'])((?:\\\1|.)*?)(\1)/g
		const candidates = Array.from(bindings, ([binding, count]) => escapeRegExp(binding) + (count - 1)).join("|")
		const variables = new RegExp(candidates, "g")
		code = code.replace(string, (match, open, data, close) => {
			const fixed = data.replace(variables, (match) => match.replace(/\d+$/, ""))
			return open + fixed + close
		})

		//fix props
		const props = new RegExp(`((?:[^:]\\/\\/.*)?\\.\\s*)(${candidates})|([\\{,]\\s*)(${candidates})(\\s*:)`, "gm")
		code = code.replace(props, (match, dot, a, pre, b, post) => {
			// Don't do anything because dot was matched in a comment
			if (dot && dot.indexOf("//") === 1) return match
			if (dot) return dot + a.replace(/\d+$/, "")
			return pre + b.replace(/\d+$/, "") + post
		})

		return code
			.replace(/("|')use strict\1;?/gm, "") // remove extraneous "use strict"
			.replace(/module\.exports\s*=\s*/gm, escapeReplace(rest ? `var _${uuid}` + eq : def + (rest ? "_" : "") + variable + eq)) // export
			+ (rest ? `\n${def}${variable}${eq}_${uuid}` : "") // if `rest` is truthy, it means the expression is fluent or higher-order (e.g. require(path).foo or require(path)(foo)
	}

	const code = ";(function() {\n" +
		(await process(path.resolve(input), await readFile(input, "utf-8")))
			.replace(/^\s*((?:var|let|const|)[\t ]*)([\w_$\.]+)(\s*=\s*)(\2)(?=[\s]+(\w)|;|$)/gm, "") // remove assignments to self
			.replace(/;+(\r|\n|$)/g, ";$1") // remove redundant semicolons
			.replace(/(\r|\n)+/g, "\n").replace(/(\r|\n)$/, "") + // remove multiline breaks
		"\n}());"

	//try {new Function(code); console.log(`build completed at ${new Date()}`)} catch (e) {}
	error = null
	return code
}
