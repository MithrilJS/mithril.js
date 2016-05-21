"use strict"

var m = require("./render/hyperscript")
var trust = require("./render/trust")
var coreRenderer = require("./render/render")
var apiMounter = require("./api/mount")
var apiRouter = require("./api/router")
var coreRequester = require("./request/request")
var redraw = {run: function() {}}

m.redraw = function() {
	redraw.run()
}
m.trust = trust
m.render = coreRenderer(window).render
m.mount = apiMounter(window, redraw)
m.route = apiRouter(window, redraw)
m.request = coreRequester(window, Promise).ajax

module.exports = m
