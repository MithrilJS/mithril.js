#!/usr/bin/env node
"use strict"

const {promises: fs} = require("fs")
const path = require("path")
const {Glob} = require("glob")
const marked = require("marked")
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
		this.awaiting = []
		this.messages = []
		this.fatalErrorCount = 0
	}
	_emitTolerate(...data) {
		let str = data.join("\n")
		if (str.endsWith("\n")) str = str.slice(0, -1)
		this.messages.push(str)
	}

	_emit(...data) {
		this._emitTolerate(...data)
		this.fatalErrorCount++
	}

	_block() {
		return `\`\`\`${this._lang || ""}\n${this._code}\n\`\`\``
	}

	link(href) {
		// Don't fail if something byzantine shows up - it's the freaking
		// internet. Just log it and move on.
		const httpError = (e) =>
			this._emitTolerate(`http error for ${href}`, e.message)

		// Prefer https: > http: where possible, but allow http: when https: is
		// inaccessible.
		if ((/^https?:\/\//).test(href)) {
			const url = href.replace(/#.*$/, "")
			this.awaiting.push(request.head(url).then(() => {
				const isHTTPS = href.startsWith("https:")
				if (!isHTTPS) {
					return request.head(`https:${url.slice(7)}`).then(
						() => this._emit("change http: to https:"),
						() => { /* ignore inner errors */ }
					)
				}
			}, (e) => {
				if (e.statusCode === 404) {
					this._emit(`broken external link: ${href}`)
				}
				else {
					if (
						e.error.code === "ERR_TLS_CERT_ALTNAME_INVALID" &&
						href.startsWith("https://")
					) {
						return request.head(`http:${url.slice(6)}`).then(
							() => this._emit(`change ${href} to use http:`),
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
				this.awaiting.push(fs.access(resolved).catch(() => {
					this._emit(`broken internal link: ${href}`)
				}))
			}
		}
	}

	code(code, lang) {
		this._code = code
		this._lang = lang
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
				this._emit(
					"Code block possibly missing `javascript` language tag",
					this._block(),
				)
			}

			try {
				JSON.parse(this._code)
				this._emit(
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
		if (!this.lang || !(/^js$|^javascript$/).test(this._lang)) return
		if (this._error != null) {
			this._emit(
				"JS code block has invalid syntax", this._error.message,
				this._block()
			)
		}
	}

	_ensureCommentStyle() {
		if (!this.lang || !(/^js$|^javascript$/).test(this._lang)) return
		if ((/(^|\s)\/\/[\S]/).test(this._code)) {
			this._emit("Comment is missing a preceding space", this._block())
		}
	}
}

async function getFileInfo(file) {
	const {size, mtime} = await fs.stat(file)
	const timestamp = Number(mtime)
	return {size, timestamp}
}

function report(file, data, totals, nextCache) {
	data.messages.forEach((msg) => console.log(`${file} - ${msg}\n${"-".repeat(60)}`))
	if (data.fatalErrorCount > 0) process.exitCode = 1
	if (nextCache != null) nextCache[file] = data
	if (totals != null) {
		totals.errors += data.fatalErrorCount
		totals.warnings += data.messages.length - data.fatalErrorCount
	}
}

exports.lintOne = lintOne
// `cache` and `nextCache` are only passed from `lintAll()`, not when watching
async function lintOne(file, totals, cache, nextCache) {
	const contents = await fs.readFile(file, "utf-8")
	// check for nextCache, because cache will be undefined the first time the linter runs
	const {size, timestamp} = (nextCache != null) ? await getFileInfo(file) : {}
	if (cache != null && cache[file] != null) {
		const cached = cache[file]
		if (size === cached.size && timestamp === cached.timestamp && cached.messages.length === 0) {
			report(file, cached, totals, nextCache)
			return
		}
	}
	const renderer = new LintRenderer(file)
	marked(contents, {renderer})
	return Promise.all(renderer.awaiting).then(() => {
		const {fatalErrorCount, messages} = renderer
		report(file, {fatalErrorCount, messages, size, timestamp}, totals, nextCache)
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
	return async () => {
		await fs.writeFile(cachePath, JSON.stringify(nextCache), "utf-8")
		// empty return so that _command takes process.exitCode into account.
	}
}

function finalReport(totals) {
	return () => {
		const buffer = []
		if (totals.errors > 0) buffer.push(`${totals.errors} error(s)`)
		if (totals.warnings > 0) buffer.push(`${totals.warnings} warning(s)`)
		console.log()
		if (buffer.length > 0) console.log(`${buffer.join(", ")} found in the docs`)
		else console.log("The docs are in good shape!")
	}
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
	return new Promise((resolve, reject) => {
		const glob = new Glob(path.resolve(__dirname, "../**/*.md"), {
			ignore: [
				"**/change-log.md",
				"**/node_modules/**",
			],
			nodir: true,
		})
		const awaiting = []

		glob.on("match", (file) => {
			awaiting.push(lintOne(file, totals, cache, nextCache))
		})

		glob.on("error", reject)
		glob.on("end", () => resolve(
			Promise.all(awaiting)
				.then(finalReport(totals))
				.then(saveCache(nextCache))
		))
	})
}

/* eslint-disable global-require */
if (require.main === module) {
	require("./_command")({
		exec: lintAll,
		watch() {
			require("chokidar")
				.watch(path.resolve(__dirname, "../**/*.md"), {
					ignore: [
						"**/change-log.md",
						"**/node_modules/**",
					],
				})
				.on("add", lintOne)
				.on("change", lintOne)
		},
	})
}
