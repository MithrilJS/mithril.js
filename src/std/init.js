"use strict"

var m = require("../core/hyperscript")

var Init = ({f}, o) => (o ? m.retain() : m.layout((_, signal) => queueMicrotask(() => f(signal))))

module.exports = (f) => m(Init, {f})
