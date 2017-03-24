"use strict"

var PromisePolyfill = require("./promise/promise")
module.exports = require("./request/request")(window, PromisePolyfill)
