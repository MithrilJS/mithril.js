"use strict"

let hyperscript = require("./hyperscript")
let request = require("./request")
let mountRedraw = require("./mount-redraw")
let domFor = require("./render/domFor")

let m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment
m.Fragment = "["
m.mount = mountRedraw.mount
m.route = require("./route")
m.render = require("./render")
m.redraw = mountRedraw.redraw
m.request = request.request
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.parsePathname = require("./pathname/parse")
m.buildPathname = require("./pathname/build")
m.vnode = require("./render/vnode")
m.censor = require("./util/censor")
m.domFor = domFor.domFor

module.exports = m
