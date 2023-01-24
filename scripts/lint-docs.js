#!/usr/bin/env node
"use strict"

const {promises: fs} = require("fs")
const path = require("path")
const {Glob} = require("glob")
const {marked} = require("marked")
// Accept just about anything
const babelParser = require("@babel/parser")
// Peer dependency on `request`
const request = require("request-promise-native")

// lint rules
class LintRenderer extends marked.Renderer {
	constructor(file) {
		super()
		this._dir = path.dirname(file)
		this._context = undefined
		this._code = undefined
		this._lang = undefined
		this._error = undefined
		this._awaiting = []
		this._warnings = []
		this._errors = []
	}

	_addWarning(...data) {
		this._warnings.push(formatMessage(...data))
	}

	_addError(...data) {
		this._errors.push(formatMessage(...data))
	}

	_block() {
		return `\`\`\`${this._lang || ""}\n${this._code}\n\`\`\``
	}

	link(href) {
		// Don't fail if something byzantine shows up - it's the freaking
		// internet. Just log it and move on.
		const httpError = (e) =>
			this._addWarning(`http error for ${href}`, e.message)

		// Prefer https: > http: where possible, but allow http: when https: is
		// inaccessible.
		if ((/^https?:\/\//).test(href)) {
			const url = href.replace(/#.*$/, "")
			const isHTTPS = href.startsWith("https:")
			// pass along realistic headers, some sites (i.e. the IETF) return a 403 otherwise.
			const headers = {
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:71.0) Gecko/20100101 Firefox/71.0",
			}
			// some more headers if more were ever needed (from my local Firefox)

			// "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			// "Accept-Language": "en-US,en;q=0.5",
			// "Accept-Encoding": "gzip, deflate, br",
			// "DNT": "1",
			// "Connection": "keep-alive",
			// "Upgrade-Insecure-Requests": "1",
			// "Pragma": "no-cache",
			// "Cache-Control": "no-cache"

			this._awaiting.push(request.head(url, {headers}).then(() => {
				if (!isHTTPS) {
					return request.head(`https:${url.slice(7)}`, {headers}).then(
						() => this._addError("change http: to https:"),
						() => { /* ignore inner errors */ }
					)
				}
			}, (e) => {
				if (e.statusCode === 404) {
					this._addError(`broken external link: ${href}`)
				}
				else {
					if (
						isHTTPS && (
							e.error.code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
							(/ssl/i).test(e.message)
						)
					) {
						return request.head(`http:${url.slice(6)}`, {headers}).then(
							() => this._addError(`change ${href} to use http:`),
							// ignore inner errors
							() => httpError(e)
						)
					}
					httpError(e)
				}
			}))
		}
		else {
			const exec = (/^([^#?]*\.md)(?:$|\?|#)/).exec(href)
			if (exec != null) {
				const resolved = path.resolve(this._dir, exec[1])
				this._awaiting.push(fs.access(resolved).catch(() => {
					this._addError(`broken internal link: ${href}`)
				}))
			}
		}
	}

	code(code, lang) {
		this._code = code
		this._lang = lang
		this._error = null

		if (!lang || lang === "js" || lang === "javascript") {
			try {
				// Could be within any production.
				babelParser.parse(code, {
					sourceType: "unambiguous",
					allowReturnOutsideFunction: true,
					allowAwaitOutsideFunction: true,
					allowSuperOutsideMethod: true,
					allowUndeclaredExports: true,
					plugins: ["dynamicImport"],
				})
			}
			catch (e) {
				this._error = e
			}
		}
		this._ensureCodeIsHighlightable()
		this._ensureCodeIsSyntaticallyValid()
		this._ensureCommentStyle()
	}

	_ensureCodeIsHighlightable() {
		// We only care about what's not tagged here.
		if (!this._lang) {
			// TODO: ensure all code blocks have tags, and check this in CI.
			if (this._error == null) {
				this._addError(
					"Code block possibly missing `javascript` language tag",
					this._block(),
				)
			}

			try {
				JSON.parse(this._code)
				this._addError(
					"Code block possibly missing `json` language tag",
					this._block(),
				)
			}
			catch (_) {
				// ignore
			}
		}
	}

	_ensureCodeIsSyntaticallyValid() {
		if (!this._lang || !(/^js$|^javascript$/).test(this._lang)) return
		if (this._error != null) {
			this._addError(
				"JS code block has invalid syntax", this._error.message,
				this._block()
			)
		}
	}

	_ensureCommentStyle() {
		if (!this._lang || !(/^js$|^javascript$/).test(this._lang)) return
		if ((/(^|\s)\/\/[\S]/).test(this._code)) {
			this._addError("Comment is missing a preceding space", this._block())
		}
	}
}

async function getFileInfo(file) {
	const {size, mtime} = await fs.stat(file)
	const timestamp = Number(mtime)
	return {size, timestamp}
}

function report(file, data, totals, nextCache) {
	const {_warnings, _errors} = data;
	if (_warnings.length + _errors.length > 0) {
		console.log("- ".repeat(file.length/2 + 1))
		console.log(file)
		console.log("- ".repeat(file.length/2 + 1) + "\n")
		if (_errors.length > 0) {
			process.exitCode = 1
			const s = _errors.length > 1 ? "s " : " -"
			console.log(`-- ${_errors.length} Error${s}----------`)
			_errors.forEach((msg) => console.log(`\n${msg}`))
			console.log("\n")
		}
		if (_warnings.length > 0) {
			const s = _warnings.length > 1 ? "s " : " -"
			console.log(`-- ${_warnings.length} Warning${s}--------`)
			_warnings.forEach((msg) => console.log(`\n${msg}`))
			console.log("\n")
		}
		if (totals != null) {
			totals.errors += _errors.length
			totals.warnings += _warnings.length
		}
	}
	if (nextCache != null) nextCache[file] = data
}

function formatMessage(...data) {
	let str = data.join("\n")
	if (str.endsWith("\n")) str = str.slice(0, -1)
	return str
}

exports.lintOne = lintOne
// `cache` and `nextCache` are only passed from `lintAll()`, not when watching
async function lintOne(file, totals, cache, nextCache) {
	const contents = await fs.readFile(file, "utf-8")
	// check for nextCache, because cache will be undefined the first time the linter runs
	const {size, timestamp} = (nextCache != null) ? await getFileInfo(file) : {}
	if (cache != null && cache[file] != null) {
		const cached = cache[file]
		if (
			size === cached.size &&
			timestamp === cached.timestamp &&
			cached._errors.length + cached._warnings.length === 0
		) {
			report(file, cached, totals, nextCache)
			return
		}
	}
	const renderer = new LintRenderer(file)
	marked(contents, {renderer})
	return Promise.all(renderer._awaiting).then(() => {
		const {_warnings, _errors} = renderer
		report(file, {_warnings, _errors, size, timestamp}, totals, nextCache)
	})
}


const cachePath = path.join(process.cwd(), ".lint-docs-cache")

async function loadCache() {
	try {
		const source = await fs.readFile(cachePath, "utf-8")
		try {
			return JSON.parse(source)
		} catch (e) {
			console.error(e)
			return
		}
	} catch (e) {
		return
	}
}

function saveCache(nextCache) {
	return fs.writeFile(cachePath, JSON.stringify(nextCache), "utf-8")
}

function finalReport(totals) {
	const buffer = []
	if (totals.errors > 0) {
		buffer.push(`${totals.errors} error${totals.errors > 1 ? "s" : ""}`)
	}
	if (totals.warnings > 0) {
		buffer.push(`${totals.warnings} warning${totals.warnings > 1 ? "s" : ""}`)
	}
	if (buffer.length > 0) console.log(`\n${buffer.join(", ")} found in the docs\n`)
	else console.log("The docs are in good shape!\n")
}

exports.lintAll = lintAll
async function lintAll({useCache}) {
	const cache = useCache ? await loadCache() : null
	const totals = {
		errors: 0,
		warnings: 0,
	}
	// always populate the cache, even if we don't read from it
	const nextCache = {}
	await new Promise((resolve, reject) => {
		const glob = new Glob(path.resolve(__dirname, "../**/*.md"), {
			ignore: [
				"**/changelog.md",
				"**/migration-*.md",
				"**/node_modules/**",
				"**/recent-changes.md"
			],
			nodir: true,
		})
		const awaiting = []

		glob.on("match", (file) => {
			awaiting.push(lintOne(file, totals, cache, nextCache))
		})

		glob.on("error", reject)
		glob.on("end", () => resolve(Promise.all(awaiting)))
	})
	finalReport(totals)
	await saveCache(nextCache)
	// don't return anything so that _command.js picks up the errorCode.
}

/* eslint-disable global-require */
if (require.main === module) {
	require("./_command")({
		exec: lintAll,
		watch() {
			require("chokidar")
				.watch(path.resolve(__dirname, "../docs/**/*.md"), {
					ignore: [
						"**/changelog.md",
						"**/migration-*.md",
						"**/node_modules/**",
						"**/recent-changes.md"
					],
				})
				.on("add", lintOne)
				.on("change", lintOne)
		},
	})
}
