"use strict"

var fs = require("fs")
var path = require("path")

var result = require("child_process").spawnSync(
	"node",
	[path.resolve(__dirname, "../scripts/build-rollup.js"), "--test"],
	{stdio: "inherit"}
)
if (result.status) {
	// Intentionally abort the process. Otherwise, it's just going to call this
	// repeatedly, and hitting Ctrl+C every time it errors gets annoying really
	// quick.
	// eslint-disable-next-line no-process-exit
	process.exit(result.status)
}

var browserBundle = fs.readFileSync(
	path.resolve(__dirname, "../temp/index.js"),
	"utf-8"
)

var loadWithGlobals = new Function(
	"module, window, document, requestAnimationFrame, console",
	browserBundle
)

var loadWithoutGlobals = new Function("module", browserBundle)

module.exports = function(globals) {
	var mod = {exports: {}}
	if (globals == null) {
		loadWithoutGlobals(mod)
	} else {
		var window = globals ? globals.window : void 0
		// Skip the polyfill unless we're actually planning to test it
		if (
			window && globals.includePromise !== false &&
			typeof Promise === "function"
		) {
			window.Promise = Promise
		}
		loadWithGlobals(
			mod,
			window,
			window ? window.document : void 0,
			window ? window.requestAnimationFrame : void 0,
			(globals ? globals.console : void 0) || console
		)
	}
	return mod.exports
}
