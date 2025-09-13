"use strict"

var hyperscript = require("./hyperscript")
var mountRedraw = require("./mount-redraw")
var request = require("./request")
var router = require("./route")

var m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment
m.Fragment = "["
m.mount = mountRedraw.mount
m.route = router
m.render = require("./render")
m.redraw = mountRedraw.redraw
m.request = request.request
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.parsePathname = require("./pathname/parse")
m.buildPathname = require("./pathname/build")
m.vnode = require("./render/vnode")
m.censor = require("./util/censor")
m.domFor = require("./render/domFor")

module.exports = m
