"use strict"

module.exports = typeof process === "object" ? process.nextTick : window.setImmediate || window.setTimeout