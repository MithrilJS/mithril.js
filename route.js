"use strict"

let mountRedraw = require("./mount-redraw")

module.exports = require("./api/router")(typeof window !== "undefined" ? window : null, mountRedraw)
