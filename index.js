"use strict"

var m = require("./hyperscript")
var renderService = require("./render")
var requestService = require("./request")
var redrawService = require("./redraw")

requestService.setCompletionCallback(redrawService.publish)

m.route = require("./route")
m.mount = require("./mount")
m.withAttr = require("./util/withAttr")
m.prop = require("./stream")
m.render = renderService.render
m.redraw = redrawService.publish
m.request = requestService.request
m.jsonp = requestService.jsonp
m.version = "bleeding-edge"

module.exports = m
