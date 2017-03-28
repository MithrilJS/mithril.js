"use strict"

var fs = require("fs")
var path = require("path")
var marked = require("marked")
var layout = fs.readFileSync("./docs/layout.html", "utf-8")
var version = JSON.parse(fs.readFileSync("./package.json", "utf-8")).version
try {fs.mkdirSync("./dist")} catch (e) {/* ignore */}
try {fs.mkdirSync("./dist/archive")} catch (e) {/* ignore */}
try {fs.mkdirSync("./dist/archive/v" + version)} catch (e) {/* ignore */}

var guides = fs.readFileSync("docs/nav-guides.md", "utf-8")
var methods = fs.readFileSync("docs/nav-methods.md", "utf-8")

var index = fs.readFileSync("docs/index.md", "utf-8")
fs.writeFileSync("README.md", index.replace(/(\]\()(.+?)\.md(\))/g, "$1http://mithril.js.org/$2.html$3"), "utf-8")

generate("docs")

function generate(pathname) {
	if (fs.lstatSync(pathname).isDirectory()) {
		fs.readdirSync(pathname).forEach(function(filename) {
			generate(pathname + "/" + filename)
		})
	}
	else if (!pathname.match(/tutorials|archive|nav-/)) {
		if (pathname.match(/\.md$/)) {
			var outputFilename = pathname.replace(/\.md$/, ".html")
			var markdown = fs.readFileSync(pathname, "utf-8")
			var fixed = markdown
				.replace(/`((?:\S| -> |, )+)(\|)(\S+)`/gim, function(match, a, b, c) { // fix pipes in code tags
					return "<code>" + (a + b + c).replace(/\|/g, "&#124;") + "</code>"
				})
				.replace(/(^# .+?(?:\r?\n){2,}?)(?:(-(?:.|\r|\n)+?)((?:\r?\n){2,})|)/m, function(match, title, nav) { // inject menu
					var file = path.basename(pathname)
					var link = new RegExp("([ \t]*)(- )(\\[.+?\\]\\(" + file + "\\))")
					var replace = function(match, space, li, link) {
						return space + li + "**" + link + "**" + (nav ? "\n" + nav.replace(/(^|\n)/g, "$1\t" + space) : "")
					}
					var modified = guides.match(link) ? guides.replace(link, replace) : methods.replace(link, replace)
					return title + modified + "\n\n"
				})
				.replace(/(\]\([^\)]+)(\.md)/gim, function(match, path, extension) {
					return path + (path.match(/http/) ? extension : ".html")
				}) // fix links
			var markedHtml = marked(fixed)
				.replace(/(\W)Array<([^/<]+?)>/gim, "$1Array&lt;$2&gt;") // Fix type signatures containing Array<...>
			var title = fixed.match(/^#([^\n\r]+)/i) || []
			var html = layout
				.replace(/<title>Mithril\.js<\/title>/, "<title>" + title[1] + " - Mithril.js</title>")
				.replace(/\[version\]/, version) // update version
				.replace(/\[body\]/, markedHtml)
				.replace(/<h(.) id="([^"]+?)">(.+?)<\/h.>/gim, function(match, n, id, text) { // fix anchors
					var anchor = text.toLowerCase().replace(/<(\/?)code>/g, "").replace(/<a.*?>.+?<\/a>/g, "").replace(/\.|\[|\]|&quot;|\/|\(|\)/g, "").replace(/\s/g, "-");

					return `<h${n} id="${anchor}"><a href="#${anchor}">${text}</a></h${n}>`;
				})
			fs.writeFileSync("./dist/archive/v" + version + "/" + outputFilename.replace(/^docs\//, ""), html, "utf-8")
			fs.writeFileSync("./dist/" + outputFilename.replace(/^docs\//, ""), html, "utf-8")
		}
		else if (!pathname.match(/lint|generate/)) {
			fs.writeFileSync("./dist/archive/v" + version + "/" + pathname.replace(/^docs\//, ""), fs.readFileSync(pathname, "utf-8"), "utf-8")
			fs.writeFileSync("./dist/" + pathname.replace(/^docs\//, ""), fs.readFileSync(pathname, "utf-8"), "utf-8")
		}
	}
}
