"use strict"

module.exports = require("./api/mount-redraw")(typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null)
