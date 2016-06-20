"use strict"

;(function () {

var Stream = require("./util/stream")
var m = require("./render/hyperscript")
var renderService = require("./render/render")(window)
var redrawService = require("./api/pubsub")()
var requestService = require("./request/request")(window)

requestService.setCompletionCallback(redrawService.publish)

m.version = "bleeding-edge"
m.request = requestService.xhr
m.jsonp = requestService.jsonp
m.route = require("./api/router")(window, renderService, redrawService)
m.mount = require("./api/mount")(renderService, redrawService)
m.trust = require("./render/trust")
m.prop = Stream.stream
m.prop.combine = Stream.combine
m.prop.reject = Stream.reject
m.prop.HALT = Stream.HALT
m.withAttr = require("./util/withAttr")
m.render = renderService.render
m.redraw = redrawService.publish

if (typeof module === "object") module.exports = m
else window.m = m

})()