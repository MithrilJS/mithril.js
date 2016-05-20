"use strict"

var m = require("./render/hyperscript")
var trust = require("./render/trust")
var createRenderer = require("./render/render")
var createMounter = require("./api/mount")
var createRouterInstance = require("./api/router")
var createRequester = require("./request/request")
var redraw = {run: function() {}}

m.redraw = function() {
	redraw.run()
}
m.trust = trust
m.render = createRenderer(window).render
m.mount = createMounter(window, redraw)
m.route = createRouterInstance(window, redraw)
m.request = createRequester(window, Promise).ajax

module.exports = m
