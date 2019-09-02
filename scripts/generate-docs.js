"use strict"

const {promises: fs} = require("fs")
const path = require("path")
const {promisify} = require("util")
const marked = require("marked")
const rimraf = promisify(require("rimraf"))
const {execFileSync} = require("child_process")
const escapeRegExp = require("escape-string-regexp")
const HTMLMinifier = require("html-minifier")
const upstream = require("./_upstream")

const r = (file) => path.resolve(__dirname, "..", file)

// Minify our docs.
const htmlMinifierConfig = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	conservativeCollapse: true,
	continueOnParseError: true,
	minifyCss: {
		compatibility: "ie9",
	},
	minifyJs: true,
	minifyUrls: true,
	preserveLineBreaks: true,
	removeAttributeQuotes: true,
	removeCdatasectionsFromCdata: true,
	removeComments: true,
	removeCommentsFromCdata: true,
	removeEmptyAttributes: true,
	removeOptionalTags: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	useShortDoctype: true,
}

module.exports = generate
async function generate() {
	return (await makeGenerator()).generate()
}

async function makeGenerator() {
	await rimraf(r("dist"))

	const [guides, methods, layout, pkg] = await Promise.all([
		fs.readFile(r("docs/nav-guides.md"), "utf-8"),
		fs.readFile(r("docs/nav-methods.md"), "utf-8"),
		fs.readFile(r("docs/layout.html"), "utf-8"),
		fs.readFile(r("package.json"), "utf-8"),
		fs.mkdir(r("dist"), {recursive: true}),
	])

	const version = JSON.parse(pkg).version

	// Make sure we have the latest archive.
	execFileSync("git", [
		"fetch", "--depth=1",
		upstream.fetch.remote, "gh-pages",
	])

	// Set up archive directories
	execFileSync("git", [
		"checkout", `${upstream.fetch.remote}/gh-pages`,
		"--", "archive",
	])
	await fs.rename(r("archive"), r("dist/archive"))
	await fs.mkdir(r(`dist/archive/v${version}`), {recursive: true})
	// Tell Git to ignore our changes - it's no longer there.
	execFileSync("git", ["add", "archive"])

	return new Generator({version, guides, methods, layout})
}

class Generator {
	constructor(opts) {
		this._version = opts.version
		this._guides = opts.guides
		this._methods = opts.methods
		this._layout = opts.layout
	}

	compilePage(file, markdown) {
		file = path.basename(file)
		const link = new RegExp(
			`([ \t]*)(- )(\\[.+?\\]\\(${escapeRegExp(file)}\\))`
		)
		const src = link.test(this._guides) ? this._guides : this._methods
		let body = markdown

		// fix pipes in code tags
		body = body.replace(/`((?:\S| -> |, )+)(\|)(\S+)`/gim,
			(match, a, b, c) =>
				`<code>${(a + b + c).replace(/\|/g, "&#124;")}</code>`
		)

		// inject menu
		body = body.replace(
			/(^# .+?(?:\r?\n){2,}?)(?:(-(?:.|\r|\n)+?)((?:\r?\n){2,})|)/m,
			(match, title, nav) => {
				if (!nav) {
					return title + src.replace(link, "$1$2**$3**") + "\n\n"
				}
				return title + src.replace(link, (match, space, li, link) =>
					`${space}${li}**${link}**\n${
						nav.replace(/(^|\n)/g, `$1\t${space}`)
					}`
				) + "\n\n"
			}
		)

		// fix links
		body = body.replace(/(\]\([^\)]+)(\.md)/gim, (match, path, extension) =>
			path + ((/http/).test(path) ? extension : ".html")
		)

		// Fix type signatures containing Array<...>
		body = body.replace(/(\W)Array<([^/<]+?)>/gim, "$1Array&lt;$2&gt;")

		const markedHtml = marked(body)
		const title = body.match(/^#([^\n\r]+)/i) || []

		let result = this._layout

		result = result.replace(
			/<title>Mithril\.js<\/title>/,
			`<title>${title[1]} - Mithril.js</title>`
		)

		// update version
		result = result.replace(/\[version\]/g, this._version)

		// insert parsed HTML
		result = result.replace(/\[body\]/, markedHtml)

		// fix anchors
		const anchorIds = new Map()

		result = result.replace(
			/<h([1-6]) id="([^"]+)">(.+?)<\/h\1>/gim,
			(match, n, id, text) => {
				let anchor = text.toLowerCase()
					.replace(/<(\/?)code>/g, "")
					.replace(/<a.*?>.+?<\/a>/g, "")
					.replace(/\.|\[|\]|&quot;|\/|\(|\)/g, "")
					.replace(/\s/g, "-");

				const anchorId = anchorIds.get(anchor)
				anchorIds.set(anchor, anchorId != null ? anchorId + 1 : 0)
				if (anchorId != null) anchor += anchorId
				return `<h${n} id="${anchor}">` +
					`<a href="#${anchor}">${text}</a>` +
					`</h${n}>`
			}
		)

		return result
	}

	async eachTarget(relative, init) {
		await Promise.all([
			init(r(`dist/archive/v${this._version}/${relative}`)),
			init(r(`dist/${relative}`)),
		])
	}

	async generateSingle(file) {
		const relative = path.relative(r("docs"), file)
		const archived = (target, init) =>
			this.eachTarget(target, async (dest) => {
				await fs.mkdir(path.dirname(dest), {recursive: true})
				await init(dest)
			})

		if (!(/\.(md|html)$/).test(file)) {
			await archived(relative, (dest) => fs.copyFile(file, dest))
			console.log(`Copied: ${relative}`)
		}
		else {
			let html = await fs.readFile(file, "utf-8")
			if (file.endsWith(".md")) html = this.compilePage(file, html)
			const minified = HTMLMinifier.minify(html, htmlMinifierConfig)
			await archived(
				relative.replace(/\.md$/, ".html"),
				(dest) => fs.writeFile(dest, minified)
			)
			console.log(`Compiled: ${relative}`)
		}
	}

	async generateRec(file) {
		let files
		try {
			files = await fs.readdir(file)
		}
		catch (e) {
			if (e.code !== "ENOTDIR") throw e
			return this.generateSingle(file)
		}

		const devOnly = /^layout\.html$|^archive$|^nav-/
		// Don't care about the return value here.
		await Promise.all(
			files
				.filter((f) => !devOnly.test(f))
				.map((f) => this.generateRec(path.join(file, f)))
		)
	}

	async generate() {
		await this.generateRec(r("docs"))
		// Just ensure it exists.
		await (await fs.open(r("dist/.nojekyll"), "a")).close()
	}
}

/* eslint-disable global-require */
if (require.main === module) {
	require("./_command")({
		exec: generate,
		async watch() {
			let timeout, genPromise
			function updateGenerator() {
				if (timeout == null) return
				clearTimeout(timeout)
				genPromise = new Promise((resolve) => {
					timeout = setTimeout(function() {
						timeout = null
						resolve(makeGenerator().then((g) => g.generate()))
					}, 100)
				})
			}

			async function updateFile(file) {
				if ((/^layout\.html$|^archive$|^nav-/).test(file)) {
					updateGenerator()
				}
				(await genPromise).generateSingle(file)
			}

			async function removeFile(file) {
				(await genPromise).eachTarget(file, (dest) => fs.unlink(dest))
			}

			require("chokidar").watch(r("docs"), {
				ignored: ["archive/**", /(^|\\|\/)\../],
				// This depends on `layout`/etc. existing first.
				ignoreInitial: true,
				awaitWriteFinish: true,
			})
				.on("ready", updateGenerator)
				.on("add", updateFile)
				.on("change", updateFile)
				.on("unlink", removeFile)
				.on("unlinkDir", removeFile)
		},
	})
}
