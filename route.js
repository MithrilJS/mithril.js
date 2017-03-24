"use strict"

var redrawService = require("./redraw")

module.exports = require("./api/router")(window, redrawService)
