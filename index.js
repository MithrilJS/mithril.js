"use strict"

var m = require("./render/hyperscript")
var renderer = require("./render/render")(window)
var redraw = require("./api/pubsub")()

m.request = require("./request/request")(window, Promise).ajax
m.route = require("./api/router")(window, renderer, redraw)
m.mount = require("./api/mount")(renderer, redraw)
m.trust = require("./render/trust")
m.render = renderer.render
m.redraw = redraw.publish

module.exports = m
