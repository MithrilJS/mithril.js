"use strict"

var redrawService = require("./redraw")
var mount = require("./mount")

module.exports = require("./api/router")(window, redrawService, mount)
