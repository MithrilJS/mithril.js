"use strict"

var m = require("./hyperscript")
var requestService = require("./request")
var redrawService = require("./redraw")

requestService.setCompletionCallback(redrawService.redraw)

m.mount = require("./mount")
m.route = require("./route")
m.withAttr = require("./util/withAttr")
m.render = require("./render").render
m.redraw = redrawService.redraw
m.request = requestService.request
m.jsonp = requestService.jsonp
m.parseQueryString = require("./querystring/parse")
m.buildQueryString = require("./querystring/build")
m.version = "bleeding-edge"
m.vnode = require("./render/vnode")

module.exports = m
