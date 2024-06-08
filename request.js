"use strict"

var mountRedraw = require("./mount-redraw")

module.exports = require("./request/request")(typeof window !== "undefined" ? window : null, mountRedraw.redraw)
