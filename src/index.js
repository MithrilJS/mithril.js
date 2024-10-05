"use strict"
/* global window: false, requestAnimationFrame: false */

var m = require("./core/hyperscript")
var mountRedraw = require("./core/mount-redraw")(typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null)

m.mount = mountRedraw.mount
m.route = require("./std/router")(typeof window !== "undefined" ? window : null, mountRedraw.redraw)
m.render = require("./core/render")
m.redraw = mountRedraw.redraw
m.p = require("./std/p")
m.withProgress = require("./std/with-progress")
m.lazy = require("./std/lazy")
m.init = require("./std/init")
m.use = require("./std/use")
m.tracked = require("./std/tracked")

module.exports = m
