"use strict"

var m = require("./hyperscript")
var mountRedraw = require("./mount-redraw")

m.mount = mountRedraw.mount
m.route = require("./route")
m.render = require("./render")
m.redraw = mountRedraw.redraw
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.p = require("./util/p")
m.withProgress = require("./util/with-progress")
m.censor = require("./util/censor")
m.lazy = require("./util/lazy")(mountRedraw.redraw)

module.exports = m
