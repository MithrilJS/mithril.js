"use strict"

module.exports = require("./render/render")(typeof window !== "undefined" ? window : null)
