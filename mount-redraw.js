"use strict"

var render = require("./render")

module.exports = require("./api/mount-redraw")(render, typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null)
