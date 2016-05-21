"use strict"

var m = require("./render/hyperscript")
var trust = require("./render/trust")
var coreRenderer = require("./render/render")
var apiRedraw = require("./api/redraw")
var apiMounter = require("./api/mount")
var apiRouter = require("./api/router")
var coreRequester = require("./request/request")
var renderers = []

m.redraw = apiRedraw(renderers)
m.trust = trust
m.render = coreRenderer(window).render
m.mount = apiMounter(window, renderers)
m.route = apiRouter(window, renderers)
m.request = coreRequester(window, Promise).ajax

module.exports = m
