"use strict"

var hyperscript = require("./hyperscript")
var m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment

var requestService = require("./request")
var redrawService = require("./redraw")

requestService.setCompletionCallback(redrawService.redraw)

m.mount = require("./mount")
m.route = require("./route")
m.render = require("./render").render
m.redraw = redrawService.redraw
m.request = requestService.request
m.jsonp = requestService.jsonp
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.parsePathname = require("./pathname/parse")
m.buildPathname = require("./pathname/build")
m.version = "bleeding-edge"
m.vnode = require("./render/vnode")
m.PromisePolyfill = require("./promise/polyfill")

module.exports = m
