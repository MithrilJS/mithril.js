"use strict"

var o = require("../../ospec/ospec")
var pushStateMock = require("../../test-utils/pushStateMock")
var Router = require("../../router/router")

o.spec("Router.setPath", function() {
	void ["#", "?", "", "#!", "?!", "/foo"].forEach(function(prefix) {
		o.spec("using prefix `" + prefix + "`", function() {
			var $window, router, onRouteChange, onFail
	
			o.beforeEach(function() {
				$window = pushStateMock()
				router = new Router($window)
				router.setPrefix(prefix)
				onRouteChange = o.spy()
				onFail = o.spy()
			})
			
			o("sets route via API", function() {
				$window.location.href = prefix + "/test"
				router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)
				router.setPath("/other/x/y/z?c=d#e=f")
				
				o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
			})
			o("sets route w/ escaped unicode", function() {
				$window.location.href = prefix + "/test"
				router.defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}}, onRouteChange, onFail)
				router.setPath("/%C3%B6?%C3%B6=%C3%B6#%C3%B6=%C3%B6")
				
				o(router.getPath()).equals("/ö?ö=ö#ö=ö")
			})
			o("sets route w/ unicode", function() {
				$window.location.href = prefix + "/test"
				router.defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}}, onRouteChange, onFail)
				router.setPath("/ö?ö=ö#ö=ö")
				
				o(router.getPath()).equals("/ö?ö=ö#ö=ö")
			})
			
			o("sets route on fallback mode", function() {
				$window.location.href = "file://" + prefix + "/test"
				
				router = new Router($window)
				router.setPrefix(prefix)
				
				router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)
				router.setPath("/other/x/y/z?c=d#e=f")
				
				o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
			})
			o("sets route via pushState/onpopstate", function() {
				$window.location.href = prefix + "/test"
				router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)
				$window.history.pushState(null, null, prefix + "/other/x/y/z?c=d#e=f")
				$window.onpopstate()
				
				o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
			})
			o("sets parameterized route", function() {
				$window.location.href = prefix + "/test"
				router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)
				router.setPath("/other/:a/:b", {a: "x", b: "y/z", c: "d", e: "f"})
				
				o(router.getPath()).equals("/other/x/y/z?c=d&e=f")
			})
			o("replace:true works", function() {
				$window.location.href = prefix + "/test"
				router.defineRoutes({"/test": {data: 1}, "/other": {data: 2}}, onRouteChange, onFail)
				router.setPath("/other", null, {replace: true})
				$window.history.back()
				
				o($window.location.href).equals("http://localhost/")
			})
			o("replace:false works", function() {
				$window.location.href = prefix + "/test"
				router.defineRoutes({"/test": {data: 1}, "/other": {data: 2}}, onRouteChange, onFail)
				router.setPath("/other", null, {replace: false})
				$window.history.back()

				var slash = prefix[0] === "/" ? "" : "/"

				o($window.location.href).equals("http://localhost" + slash + (prefix ? prefix + "/" : "") + "test")
			})
		})
	})
})