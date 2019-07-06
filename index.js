"use strict"

var hyperscript = require("./hyperscript")
var m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment

var requestService = require("./request")
var mountRedraw = require("./mount-redraw")

requestService.setCompletionCallback(mountRedraw.redraw)

m.mount = mountRedraw.mount
m.route = require("./route")
m.render = require("./render").render
m.redraw = mountRedraw.redraw
m.request = requestService.request
m.jsonp = requestService.jsonp
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.parsePathname = require("./pathname/parse")
m.buildPathname = require("./pathname/build")
m.version = require("./package.json").version
m.vnode = require("./render/vnode")
m.PromisePolyfill = require("./promise/polyfill")

module.exports = m
