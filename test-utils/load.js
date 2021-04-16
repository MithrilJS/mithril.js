"use strict"

var fs = require("fs")
var path = require("path")

try {
	fs.mkdirSync(path.resolve(__dirname, "../temp"))
} catch (e) {
	if (e.code !== "EEXIST") throw e
}

require("child_process").execSync("npm run build:test", {
	cwd: path.dirname(__dirname)
})

var mithrilInitializer = new Function(
	"module, window, document, requestAnimationFrame, console",
	fs.readFileSync(path.resolve(__dirname, "../temp/mithril.js"), "utf-8")
)

var mithrilNoGlobalInitializer = new Function(
	"module",
	fs.readFileSync(path.resolve(__dirname, "../temp/mithril.js"), "utf-8")
)

var compileTemplateInitializer = new Function(
	"module",
	fs.readFileSync(
		path.resolve(__dirname, "../temp/compileTemplate.js"),
		"utf-8"
	)
)

module.exports = {
	mithril: function(globals) {
		var mod = {exports: {}}
		if (globals == null) {
			mithrilNoGlobalInitializer(mod)
		} else {
			var window = globals ? globals.window : void 0
			// Skip the polyfill unless we're actually planning to test it
			if (
				window && globals.includePromise !== false &&
				typeof Promise === "function"
			) {
				window.Promise = Promise
			}
			mithrilInitializer(
				mod,
				window,
				window ? window.document : void 0,
				window ? window.requestAnimationFrame : void 0,
				(globals ? globals.console : void 0) || console
			)
		}
		return mod.exports
	},
	compileTemplate: function() {
		var mod = {exports: {}}
		compileTemplateInitializer(mod)
		return mod.exports
	},
}
