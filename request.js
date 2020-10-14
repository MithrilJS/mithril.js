"use strict"

var PromisePolyfill = require("./promise/promise")
var mountRedraw = require("./mount-redraw")

module.exports = require("./request/request")(typeof window !== "undefined" ? window : null, PromisePolyfill, mountRedraw.redraw)
