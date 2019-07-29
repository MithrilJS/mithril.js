"use strict"

const {createReadStream, createWriteStream, promises: fs} = require("fs")
const path = require("path")
const {promisify} = require("util")
const pipeline = promisify(require("stream").pipeline)
const marked = require("marked")
const rimraf = promisify(require("rimraf"))
const copy = require("recursive-copy")
const {execFileSync} = require("child_process")
const escapeRegExp = require("escape-string-regexp")
const HTMLMinifier = require("html-minifier")

require("./_command").exec(module, () => generate())
module.exports = generate

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

async function generate() {
	const r = (file) => path.resolve(__dirname, "..", file)

	await rimraf(r("dist"))

	const [guides, methods, layout, pkg] = await Promise.all([
		fs.readFile(r("docs/nav-guides.md"), "utf-8"),
		fs.readFile(r("docs/nav-methods.md"), "utf-8"),
		fs.readFile(r("docs/layout.html"), "utf-8"),
		fs.readFile(r("package.json"), "utf-8"),
		fs.mkdir(r("dist"), {recursive: true}),
	])

	const version = JSON.parse(pkg).version

	// Set up archive directories
	execFileSync("git", ["checkout", "gh-pages", "--", "archive"])
	await fs.rename(r("archive"), r("dist/archive"))
	await fs.mkdir(r(`dist/archive/v${version}`), {recursive: true})
	// Tell Git to ignore our changes - it's no longer there.
	execFileSync("git", ["add", "archive"])

	function compilePage(file, markdown) {
		file = path.basename(file)
		const link = new RegExp(
			`([ \t]*)(- )(\\[.+?\\]\\(${escapeRegExp(file)}\\))`
		)
		const src = link.test(guides) ? guides : methods
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

		let result = layout

		result = result.replace(
			/<title>Mithril\.js<\/title>/,
			`<title>${title[1]} - Mithril.js</title>`
		)

		// update version
		result = result.replace(/\[version\]/g, version)

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

	async function generate(file) {
		try {
			const handle = await fs.open(file, "r")
			try {
				const relative = path.relative(r("docs"), file)
				const archive = r(`dist/archive/v${version}/${relative}`)
				await fs.mkdir(path.dirname(archive), {recursive: true})

				if (file.endsWith(".md")) {
					const html = compilePage(file, await handle.readFile("utf-8"))
					const minified = HTMLMinifier.minify(html, htmlMinifierConfig)
					await fs.writeFile(archive.replace(/\.md$/, ".html"), minified)
				} else if (file.endsWith(".html")) {
					const html = await handle.readFile("utf-8")
					const minified = HTMLMinifier.minify(html, htmlMinifierConfig)
					await fs.writeFile(archive, minified)
				} else {
					await pipeline(
						createReadStream(null, {fd: handle.fd}),
						createWriteStream(archive)
					)
				}
			} finally {
				handle.close()
			}
		} catch (e) {
			if (e.code !== "EISDIR") throw e
			const files = await fs.readdir(file)
			const devOnly = /^layout\.html$|^tutorials$|^archive$|^nav-/
			await Promise.all(
				files
					.filter((f) => !devOnly.test(f))
					.map((f) => path.join(file, f))
					.map(generate)
			)
		}
	}

	await generate(r("docs"))
	await copy(r(`dist/archive/v${version}`), r("dist"))
	// Just ensure it exists.
	await (await fs.open(r("dist/.nojekyll"), "a")).close()
}
