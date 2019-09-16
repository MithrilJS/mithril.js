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
		this._file = file
		this._dir = path.dirname(file)
		this._context = undefined
		this._code = undefined
		this._lang = undefined
		this._error = undefined
		this._awaiting = []
	}

	_emitTolerate(...data) {
		let str = data.join("\n")
		if (str.endsWith("\n")) str = str.slice(0, -1)
		console.log(`${this._file} - ${str}\n${"-".repeat(60)}`)
	}

	_emit(...data) {
		this._emitTolerate(...data)
		process.exitCode = 1
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
			this._awaiting.push(request.head(url).then(() => {
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
				this._awaiting.push(fs.access(resolved).catch(() => {
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
		this._ensureCodeHasConsistentTag()
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

	_ensureCodeHasConsistentTag() {
		if (this._lang === "js") {
			this._emit("JS code block has wrong language tag", this._block())
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

exports.lintOne = lintOne
async function lintOne(file) {
	const contents = await fs.readFile(file, "utf-8")
	const renderer = new LintRenderer(file)
	marked(contents, {renderer})
	return Promise.all(renderer._awaiting)
}

exports.lintAll = lintAll
function lintAll() {
	return new Promise((resolve, reject) => {
		const glob = new Glob(path.resolve(__dirname, "../docs/**/*.md"), {
			ignore: [
				"**/change-log.md",
				"**/migration-*.md",
				"**/node_modules/**",
			],
			nodir: true,
		})
		const awaiting = []

		glob.on("match", (file) => {
			awaiting.push(lintOne(file))
		})

		glob.on("error", reject)
		glob.on("end", () => resolve(Promise.all(awaiting)))
	})
}

/* eslint-disable global-require */
if (require.main === module) {
	require("./_command")({
		exec: lintAll,
		watch() {
			require("chokidar")
				.watch(path.resolve(__dirname, "../docs/**/*.md"), {
					ignore: [
						"**/change-log.md",
						"**/migration-*.md",
						"**/node_modules/**",
					],
				})
				.on("add", lintOne)
				.on("change", lintOne)
		},
	})
}
