"use strict"

/* eslint-disable global-require */

;(function () {
	var Promise = require("./promise/promise")
	var m = require("./render/hyperscript")
	var renderService = require("./render/render")(window)
	var redrawService = require("./api/pubsub")()
	var requestService = require("./request/request")(window, Promise)

	m.request = requestService.xhr
	m.jsonp = requestService.jsonp
	m.route = require("./api/router")(window, renderService, redrawService)
	m.mount = require("./api/mount")(renderService, redrawService)
	m.trust = require("./render/trust")
	m.prop = require("./util/prop")
	m.withAttr = require("./util/withAttr")
	m.render = renderService.render
	m.redraw = redrawService.publish

	if (typeof module === "object") module.exports = m
	else window.m = m
}())
