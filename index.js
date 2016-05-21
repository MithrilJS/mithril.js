"use strict"

var m = require("./render/hyperscript")
var trust = require("./render/trust")
var coreRequester = require("./request/request")
var coreRenderer = require("./render/render")
var apiPubSub = require("./api/pubsub")
var apiMount = require("./api/mount")
var apiRouter = require("./api/router")
var redraw = apiPubSub()

m.trust = trust
m.request = coreRequester(window, Promise).ajax
m.render = coreRenderer(window).render
m.mount = apiMount(window, redraw)
m.route = apiRouter(window, redraw)
m.redraw = redraw.publish

module.exports = m
