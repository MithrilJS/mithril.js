"use strict"

var o = require("ospec")
var browserMock = require("../../test-utils/browserMock")
var loadMithril = require("../../test-utils/loadMithril")

o.spec("compileTemplate", function() {
	function executeTemplate(template, route) {
		var $window = browserMock({
			protocol: "http:",
			hostname: "localhost",
			hash: "#!" + route
		})
		var m = loadMithril({window: $window})
		var routes = {}
		var fallback = false
		routes[template] = {view: function() {}}
		routes["/:404..."] = {view: function() { fallback = true }}
		m.route($window.document.body, route, routes)
		return fallback ? "not matched" : m.route.param()
	}

	o("checks empty string", function() {
		o(executeTemplate("/", "/"))
			.deepEquals({})
	})
	o("checks identical match", function() {
		o(executeTemplate("/foo", "/foo"))
			.deepEquals({})
	})
	o("checks identical mismatch", function() {
		o(executeTemplate("/foo", "/bar"))
			.deepEquals("not matched")
	})
	o("checks single parameter", function() {
		o(executeTemplate("/:id", "/1"))
			.deepEquals({id: "1"})
	})
	o("checks single variadic parameter", function() {
		o(executeTemplate("/:id...", "/some/path"))
			.deepEquals({id: "some/path"})
	})
	o("checks single parameter with extra match", function() {
		o(executeTemplate("/:id/foo", "/1/foo"))
			.deepEquals({id: "1"})
	})
	o("checks single parameter with extra mismatch", function() {
		o(executeTemplate("/:id/foo", "/1/bar"))
			.deepEquals("not matched")
	})
	o("checks single variadic parameter with extra match", function() {
		o(executeTemplate("/:id.../foo", "/some/path/foo"))
			.deepEquals({id: "some/path"})
	})
	o("checks single variadic parameter with extra mismatch", function() {
		o(executeTemplate("/:id.../foo", "/some/path/bar"))
			.deepEquals("not matched")
	})
	o("checks multiple parameters", function() {
		o(executeTemplate("/:id/:name", "/1/2"))
			.deepEquals({id: "1", name: "2"})
	})
	o("checks incomplete multiple parameters", function() {
		o(executeTemplate("/:id/:name", "/1"))
			.deepEquals("not matched")
	})
	o("checks multiple parameters with extra match", function() {
		o(executeTemplate("/:id/:name/foo", "/1/2/foo"))
			.deepEquals({id: "1", name: "2"})
	})
	o("checks multiple parameters with extra mismatch", function() {
		o(executeTemplate("/:id/:name/foo", "/1/2/bar"))
			.deepEquals("not matched")
	})
	o("checks multiple parameters, last variadic, with extra match", function() {
		o(executeTemplate("/:id/:name.../foo", "/1/some/path/foo"))
			.deepEquals({id: "1", name: "some/path"})
	})
	o("checks multiple parameters, last variadic, with extra mismatch", function() {
		o(executeTemplate("/:id/:name.../foo", "/1/some/path/bar"))
			.deepEquals("not matched")
	})
	o("checks multiple separated parameters", function() {
		o(executeTemplate("/:id/sep/:name", "/1/sep/2"))
			.deepEquals({id: "1", name: "2"})
	})
	o("checks incomplete multiple separated parameters without separator", function() {
		o(executeTemplate("/:id/sep/:name", "/1"))
			.deepEquals("not matched")
	})
	o("checks incomplete multiple separated parameters with separator", function() {
		o(executeTemplate("/:id/sep/:name", "/1/sep"))
			.deepEquals("not matched")
	})
	o("checks multiple separated parameters missing sep", function() {
		o(executeTemplate("/:id/sep/:name", "/1/2"))
			.deepEquals("not matched")
	})
	o("checks multiple separated parameters with extra match", function() {
		o(executeTemplate("/:id/sep/:name/foo", "/1/sep/2/foo"))
			.deepEquals({id: "1", name: "2"})
	})
	o("checks multiple separated parameters with extra mismatch", function() {
		o(executeTemplate("/:id/sep/:name/foo", "/1/sep/2/bar"))
			.deepEquals("not matched")
	})
	o("checks multiple separated parameters, last variadic, with extra match", function() {
		o(executeTemplate("/:id/sep/:name.../foo", "/1/sep/some/path/foo"))
			.deepEquals({id: "1", name: "some/path"})
	})
	o("checks multiple separated parameters, last variadic, with extra mismatch", function() {
		o(executeTemplate("/:id/sep/:name.../foo", "/1/sep/some/path/bar"))
			.deepEquals("not matched")
	})
	o("checks multiple parameters + prefix", function() {
		o(executeTemplate("/route/:id/:name", "/route/1/2"))
			.deepEquals({id: "1", name: "2"})
	})
	o("checks incomplete multiple parameters + prefix", function() {
		o(executeTemplate("/route/:id/:name", "/route/1"))
			.deepEquals("not matched")
	})
	o("checks multiple parameters + prefix with extra match", function() {
		o(executeTemplate("/route/:id/:name/foo", "/route/1/2/foo"))
			.deepEquals({id: "1", name: "2"})
	})
	o("checks multiple parameters + prefix with extra mismatch", function() {
		o(executeTemplate("/route/:id/:name/foo", "/route/1/2/bar"))
			.deepEquals("not matched")
	})
	o("checks multiple parameters + prefix, last variadic, with extra match", function() {
		o(executeTemplate("/route/:id/:name.../foo", "/route/1/some/path/foo"))
			.deepEquals({id: "1", name: "some/path"})
	})
	o("checks multiple parameters + prefix, last variadic, with extra mismatch", function() {
		o(executeTemplate("/route/:id/:name.../foo", "/route/1/some/path/bar"))
			.deepEquals("not matched")
	})
	o("checks multiple separated parameters + prefix", function() {
		o(executeTemplate("/route/:id/sep/:name", "/route/1/sep/2"))
			.deepEquals({id: "1", name: "2"})
	})
	o("checks incomplete multiple separated parameters + prefix without separator", function() {
		o(executeTemplate("/route/:id/sep/:name", "/route/1"))
			.deepEquals("not matched")
	})
	o("checks incomplete multiple separated parameters + prefix with separator", function() {
		o(executeTemplate("/route/:id/sep/:name", "/route/1/sep"))
			.deepEquals("not matched")
	})
	o("checks multiple separated parameters + prefix missing sep", function() {
		o(executeTemplate("/route/:id/sep/:name", "/route/1/2"))
			.deepEquals("not matched")
	})
	o("checks multiple separated parameters + prefix with extra match", function() {
		o(executeTemplate("/route/:id/sep/:name/foo", "/route/1/sep/2/foo"))
			.deepEquals({id: "1", name: "2"})
	})
	o("checks multiple separated parameters + prefix with extra mismatch", function() {
		o(executeTemplate("/route/:id/sep/:name/foo", "/route/1/sep/2/bar"))
			.deepEquals("not matched")
	})
	o("checks multiple separated parameters + prefix, last variadic, with extra match", function() {
		o(executeTemplate("/route/:id/sep/:name.../foo", "/route/1/sep/some/path/foo"))
			.deepEquals({id: "1", name: "some/path"})
	})
	o("checks multiple separated parameters + prefix, last variadic, with extra mismatch", function() {
		o(executeTemplate("/route/:id/sep/:name.../foo", "/route/1/sep/some/path/bar"))
			.deepEquals("not matched")
	})
	o("checks query params match", function() {
		o(executeTemplate("/route/:id?foo=bar", "/route/1?foo=bar"))
			.deepEquals({id: "1", foo: "bar"})
	})
	o("checks query params key mismatch", function() {
		o(executeTemplate("/route/:id?bar=foo", "/route/1?foo=bar"))
			.deepEquals("not matched")
	})
	o("checks query params value mismatch", function() {
		o(executeTemplate("/route/:id?foo=1", "/route/1?foo=bar"))
			.deepEquals("not matched")
	})
	o("checks dot before dot", function() {
		o(executeTemplate("/:file.:ext/edit", "/file.test.png/edit"))
			.deepEquals({file: "file.test", ext: "png"})
	})
	o("checks dash before dot", function() {
		o(executeTemplate("/:file.:ext/edit", "/file-test.png/edit"))
			.deepEquals({file: "file-test", ext: "png"})
	})
	o("checks dot before dash", function() {
		o(executeTemplate("/:file-:ext/edit", "/file.test-png/edit"))
			.deepEquals({file: "file.test", ext: "png"})
	})
	o("checks dash before dash", function() {
		o(executeTemplate("/:file-:ext/edit", "/file-test-png/edit"))
			.deepEquals({file: "file-test", ext: "png"})
	})
})
