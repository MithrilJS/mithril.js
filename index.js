"use strict"

var hyperscript = require("./hyperscript")
var mountRedraw = require("./mount-redraw")

var m = (...args) => hyperscript(...args)
m.m = hyperscript
m.fragment = hyperscript.fragment
m.key = hyperscript.key
m.Fragment = "["
m.mount = mountRedraw.mount
m.route = require("./route")
m.render = require("./render")
m.redraw = mountRedraw.redraw
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.parsePathname = require("./pathname/parse")
m.p = require("./pathname/build")
m.withProgress = require("./util/with-progress")
m.vnode = require("./render/vnode")
m.censor = require("./util/censor")
m.lazy = require("./util/lazy")(mountRedraw.redraw)

module.exports = m
