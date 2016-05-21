"use strict"

var m = require("./render/hyperscript")
var trust = require("./render/trust")
var createRenderer = require("./render/render")
var createRedraw = require("./api/redraw")
var createMounter = require("./api/mount")
var createRouterInstance = require("./api/router")
var createRequester = require("./request/request")
var renderers = []

m.redraw = createRedraw(renderers)
m.trust = trust
m.render = createRenderer(window).render
m.mount = createMounter(window, renderers)
m.route = createRouterInstance(window, renderers)
m.request = createRequester(window, Promise).ajax

module.exports = m
