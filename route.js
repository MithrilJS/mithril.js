"use strict"
/* global window: false */

var mountRedraw = require("./mount-redraw")

module.exports = require("./api/router")(typeof window !== "undefined" ? window : null, mountRedraw.redraw)
