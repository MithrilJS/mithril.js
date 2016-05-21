"use strict"

var m = require("./render/hyperscript")
var rendererService = require("./render/render")(window)
var redrawService = require("./api/pubsub")()

m.request = require("./request/request")(window, Promise).ajax
m.route = require("./api/router")(window, rendererService, redrawService)
m.mount = require("./api/mount")(rendererService, redrawService)
m.trust = require("./render/trust")
m.render = rendererService.render
m.redraw = redrawService.publish

module.exports = m
