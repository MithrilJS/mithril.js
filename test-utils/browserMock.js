"use strict"

var pushStateMock = require("./pushStateMock")
var domMock = require("./domMock")
var xhrMock = require("./xhrMock")

module.exports = function(env) {
	var $window = {}

	var dom = domMock()
	var xhr = xhrMock()
	var ps = pushStateMock(env)
	for (var key in dom) if (!$window[key]) $window[key] = dom[key]
	for (var key in xhr) if (!$window[key]) $window[key] = xhr[key]
	for (var key in ps) if (!$window[key]) $window[key] = ps[key]

	return $window
}