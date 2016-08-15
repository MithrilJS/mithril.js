"use strict"

var log = console.error.bind(console)
var stream = require("./stream/index");
var m = require("./render/hyperscript")
var renderService = require("./render/render")(window)
var requestService = require("./request/request")(window, log)
var redrawService = require("./api/pubsub")()

requestService.setCompletionCallback(redrawService.publish)

m.route = require("./api/router")(window, renderService, redrawService)
m.mount = require("./api/mount")(renderService, redrawService)
m.trust = require("./render/trust")
m.withAttr = require("./util/withAttr")
m.prop = stream
m.render = renderService.render
m.redraw = redrawService.publish
m.request = requestService.xhr
m.jsonp = requestService.jsonp
m.version = "bleeding-edge"

module.exports = m
