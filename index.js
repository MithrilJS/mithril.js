"use strict"

var m = require("./render/hyperscript")
var coreRenderer = require("./render/render")
var redraw = require("./api/pubsub")()

m.request = require("./request/request")(window, Promise).ajax
m.render = coreRenderer(window).render
m.trust = require("./render/trust")
m.mount = require("./api/mount")(window, redraw)
m.route = require("./api/router")(window, redraw)
m.redraw = redraw.publish

module.exports = m
