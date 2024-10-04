"use strict"

var m = require("../render/hyperscript")

var Init = () => ({
	view: ({attrs: {f}}, o) => (
		o ? m.retain() : m.layout((_, signal) => queueMicrotask(() => f(signal)))
	)
})

module.exports = (f) => m(Init, {f})
