import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("match", () => {
	var match = (path, pattern) => {
		var url = new URL(path, "http://localhost/")
		return m.match({path: url.pathname, params: url.searchParams}, pattern)
	}

	o("checks empty string", function() {
		o(match("/", "/")).deepEquals({})
	})
	o("checks identical match", function() {
		o(match("/foo", "/foo")).deepEquals({})
	})
	o("checks identical mismatch", function() {
		o(match("/bar", "/foo")).deepEquals(undefined)
	})
	o("checks single parameter", function() {
		o(match("/1", "/:id")).deepEquals({id: "1"})
	})
	o("checks single variadic parameter", function() {
		o(match("/some/path", "/*id")).deepEquals({id: "some/path"})
	})
	o("checks single parameter with extra match", function() {
		o(match("/1/foo", "/:id/foo")).deepEquals({id: "1"})
	})
	o("checks single parameter with extra mismatch", function() {
		o(match("/1/bar", "/:id/foo")).deepEquals(undefined)
	})
	o("rejects single variadic parameter with extra match", function() {
		o(() => match("/some/path/foo", "/*id/foo")).throws(SyntaxError)
	})
	o("checks single variadic parameter with extra mismatch", function() {
		o(() => match("/some/path/bar", "/*id2/foo")).throws(SyntaxError)
	})
	o("checks multiple parameters", function() {
		o(match("/1/2", "/:id/:name")).deepEquals({id: "1", name: "2"})
	})
	o("checks incomplete multiple parameters", function() {
		o(match("/1", "/:id/:name")).deepEquals(undefined)
	})
	o("checks multiple parameters with extra match", function() {
		o(match("/1/2/foo", "/:id/:name/foo")).deepEquals({id: "1", name: "2"})
	})
	o("checks multiple parameters with extra mismatch", function() {
		o(match("/1/2/bar", "/:id/:name/foo")).deepEquals(undefined)
	})
	o("checks multiple parameters, last variadic, with extra match", function() {
		o(() => match("/1/some/path/foo", "/:id/*name/foo")).throws(SyntaxError)
	})
	o("checks multiple parameters, last variadic, with extra mismatch", function() {
		o(() => match("/1/some/path/bar", "/:id/*name2/foo")).throws(SyntaxError)
	})
	o("checks multiple separated parameters", function() {
		o(match("/1/sep/2", "/:id/sep/:name")).deepEquals({id: "1", name: "2"})
	})
	o("checks incomplete multiple separated parameters", function() {
		o(match("/1", "/:id/sep/:name")).deepEquals(undefined)
		o(match("/1/sep", "/:id/sep/:name")).deepEquals(undefined)
	})
	o("checks multiple separated parameters missing sep", function() {
		o(match("/1/2", "/:id/sep/:name")).deepEquals(undefined)
	})
	o("checks multiple separated parameters with extra match", function() {
		o(match("/1/sep/2/foo", "/:id/sep/:name/foo")).deepEquals({id: "1", name: "2"})
	})
	o("checks multiple separated parameters with extra mismatch", function() {
		o(match("/1/sep/2/bar", "/:id/sep/:name/foo")).deepEquals(undefined)
	})
	o("checks multiple separated parameters, last variadic, with extra match", function() {
		o(() => match("/1/sep/some/path/foo", "/:id/sep/*name/foo")).throws(SyntaxError)
	})
	o("checks multiple separated parameters, last variadic, with extra mismatch", function() {
		o(() => match("/1/sep/some/path/bar", "/:id/sep/*name2/foo")).throws(SyntaxError)
	})
	o("checks multiple parameters + prefix", function() {
		o(match("/route/1/2", "/route/:id/:name")).deepEquals({id: "1", name: "2"})
	})
	o("checks incomplete multiple parameters + prefix", function() {
		o(match("/route/1", "/route/:id/:name")).deepEquals(undefined)
	})
	o("checks multiple parameters + prefix with extra match", function() {
		o(match("/route/1/2/foo", "/route/:id/:name/foo")).deepEquals({id: "1", name: "2"})
	})
	o("checks multiple parameters + prefix with extra mismatch", function() {
		o(match("/route/1/2/bar", "/route/:id/:name/foo")).deepEquals(undefined)
	})
	o("checks multiple parameters + prefix, last variadic, with extra match", function() {
		o(() => match("/route/1/some/path/foo", "/route/:id/*name/foo")).throws(SyntaxError)
	})
	o("checks multiple parameters + prefix, last variadic, with extra mismatch", function() {
		o(() => match("/route/1/some/path/bar", "/route/:id/*name/foo")).throws(SyntaxError)
	})
	o("checks multiple separated parameters + prefix", function() {
		o(match("/route/1/sep/2", "/route/:id/sep/:name")).deepEquals({id: "1", name: "2"})
	})
	o("checks incomplete multiple separated parameters + prefix", function() {
		o(match("/route/1", "/route/:id/sep/:name")).deepEquals(undefined)
		o(match("/route/1/sep", "/route/:id/sep/:name")).deepEquals(undefined)
	})
	o("checks multiple separated parameters + prefix missing sep", function() {
		o(match("/route/1/2", "/route/:id/sep/:name")).deepEquals(undefined)
	})
	o("checks multiple separated parameters + prefix with extra match", function() {
		o(match("/route/1/sep/2/foo", "/route/:id/sep/:name/foo")).deepEquals({id: "1", name: "2"})
	})
	o("checks multiple separated parameters + prefix with extra mismatch", function() {
		o(match("/route/1/sep/2/bar", "/route/:id/sep/:name/foo")).deepEquals(undefined)
	})
	o("checks multiple separated parameters + prefix, last variadic, with extra match", function() {
		o(() => match("/route/1/sep/some/path/foo", "/route/:id/sep/*name/foo")).throws(SyntaxError)
	})
	o("checks multiple separated parameters + prefix, last variadic, with extra mismatch", function() {
		o(() => match("/route/1/sep/some/path/bar", "/route/:id/sep/*name2/foo")).throws(SyntaxError)
	})
	o("checks dot before dot", function() {
		o(match("/file.test.png/edit", "/:file.:ext/edit")).deepEquals({file: "file.test", ext: "png"})
	})
	o("checks dash before dot", function() {
		o(match("/file-test.png/edit", "/:file.:ext/edit")).deepEquals({file: "file-test", ext: "png"})
	})
	o("checks dot before dash", function() {
		o(match("/file.test-png/edit", "/:file-:ext/edit")).deepEquals({file: "file.test", ext: "png"})
	})
	o("checks dash before dash", function() {
		o(match("/file-test-png/edit", "/:file-:ext/edit")).deepEquals({file: "file-test", ext: "png"})
	})
})
