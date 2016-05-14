"use strict"

var m = require("./render/hyperscript")
var trust = require("./render/trust")
var createMounter = require("./mount")
var createRouterInstance = require("./router")
var createRequester = require("./request/request")
var redraw = {run: function() {}}

m.redraw = function() {
	redraw.run()
}
m.trust = trust
m.mount = createMounter(window, redraw)
m.route = createRouterInstance(window, redraw)
m.request = createRequester(window, Promise).ajax

module.exports = m
