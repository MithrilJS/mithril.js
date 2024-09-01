"use strict"

const path = require("path")

const root = path.dirname(__dirname)
const p = (...args) => path.resolve(root, ...args)
const rel = (file) => path.relative(root, file).replace(/\\/g, "/")
const noop = () => {}

function warnError(e) {
	// Don't care about any of these.
	if ((/^(?:ECONNRESET|ECONNABORT|EPIPE)$/).test(e.code)) {
		return
	}

	process.exitCode = 1
	console.warn(e.stack)
}

module.exports = {
	root,
	p,
	rel,
	warnError,
	noop,
}
