"use strict"

var o = require("../../ospec/ospec")
var pushStateMock = require("../../test-utils/pushStateMock")
var Router = require("../../router/router")

o.spec("router", function() {
	void ["#", "?", "", "#!", "?!"].forEach(function(prefix) {
		o.spec("using prefix `" + prefix + "`", function() {
			var $window, router, onRouteChange, onFail
	
			o.beforeEach(function() {
				$window = pushStateMock()
				router = new Router($window, prefix)
				onRouteChange = o.spy()
				onFail = o.spy()
			})
			
			o.spec("defineRoutes", function() {
				o("resolves to route", function() {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {}, "/test", "/test"])
					o(onFail.callCount).equals(0)
				})
				
				o("handles parameterized route", function() {
					$window.location.href = prefix + "/test/x"
					router.defineRoutes({"/test/:a": {data: 1}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {a: "x"}, "/test/x", "/test/:a"])
					o(onFail.callCount).equals(0)
				})
				
				o("handles multi-parameterized route", function() {
					$window.location.href = prefix + "/test/x/y"
					router.defineRoutes({"/test/:a/:b": {data: 1}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {a: "x", b: "y"}, "/test/x/y", "/test/:a/:b"])
					o(onFail.callCount).equals(0)
				})
				
				o("handles rest parameterized route", function() {
					$window.location.href = prefix + "/test/x/y"
					router.defineRoutes({"/test/:a...": {data: 1}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {a: "x/y"}, "/test/x/y", "/test/:a..."])
					o(onFail.callCount).equals(0)
				})
				
				o("handles route with search", function() {
					$window.location.href = prefix + "/test?a=b&c=d"
					router.defineRoutes({"/test": {data: 1}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {a: "b", c: "d"}, "/test?a=b&c=d", "/test"])
					o(onFail.callCount).equals(0)
				})
				
				o("handles route with hash", function() {
					$window.location.href = prefix + "/test#a=b&c=d"
					router.defineRoutes({"/test": {data: 1}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {a: "b", c: "d"}, "/test#a=b&c=d", "/test"])
					o(onFail.callCount).equals(0)
				})
				
				o("handles route with search and hash", function() {
					$window.location.href = prefix + "/test?a=b#c=d"
					router.defineRoutes({"/test": {data: 1}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {a: "b", c: "d"}, "/test?a=b#c=d", "/test"])
					o(onFail.callCount).equals(0)
				})
				
				o("calls reject", function() {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/other": {data: 1}}, onRouteChange, onFail)
					
					o(onFail.callCount).equals(1)
					o(onFail.args).deepEquals(["/test", {}])
				})
				
				o("calls reject w/ search and hash", function() {
					$window.location.href = prefix + "/test?a=b#c=d"
					router.defineRoutes({"/other": {data: 1}}, onRouteChange, onFail)
					
					o(onFail.callCount).equals(1)
					o(onFail.args).deepEquals(["/test?a=b#c=d", {a: "b", c: "d"}])
				})
				
				o("handles out of order routes", function() {
					$window.location.href = prefix + "/z/y/x"
					router.defineRoutes({"/z/y/x": {data: 1}, "/:a...": {data: 2}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {}, "/z/y/x", "/z/y/x"])
				})
				
				o("handles reverse out of order routes", function() {
					$window.location.href = prefix + "/z/y/x"
					router.defineRoutes({"/:a...": {data: 2}, "/z/y/x": {data: 1}}, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 2}, {a: "z/y/x"}, "/z/y/x", "/:a..."])
				})
				
				o("handles dynamically added out of order routes", function() {
					var routes = {}
					routes["/z/y/x"] = {data: 1}
					routes["/:a..."] = {data: 2}
					
					$window.location.href = prefix + "/z/y/x"
					router.defineRoutes(routes, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {}, "/z/y/x", "/z/y/x"])
				})
				
				o("handles reversed dynamically added out of order routes", function() {
					var routes = {}
					routes["/:a..."] = {data: 2}
					routes["/z/y/x"] = {data: 1}
					
					$window.location.href = prefix + "/z/y/x"
					router.defineRoutes(routes, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 2}, {a: "z/y/x"}, "/z/y/x", "/:a..."])
				})
				
				o("handles mixed out of order routes", function() {
					var routes = {"/z/y/x": {data: 1}}
					routes["/:a..."] = {data: 2}
					
					$window.location.href = prefix + "/z/y/x"
					router.defineRoutes(routes, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 1}, {}, "/z/y/x", "/z/y/x"])
				})
				
				o("handles reverse mixed out of order routes", function() {
					var routes = {"/:a...": {data: 2}}
					routes["/z/y/x"] = {data: 12}
					
					$window.location.href = prefix + "/z/y/x"
					router.defineRoutes(routes, onRouteChange, onFail)
					
					o(onRouteChange.callCount).equals(1)
					o(onRouteChange.args).deepEquals([{data: 2}, {a: "z/y/x"}, "/z/y/x", "/:a..."])
				})
				
				o("replays", function() {
					$window.location.href = prefix + "/test"
					var replay = router.defineRoutes({"/test": {data: 1}}, onRouteChange, onFail)
					replay()
					
					o(onRouteChange.callCount).equals(2)
					o(onRouteChange.args).deepEquals([{data: 1}, {}, "/test", "/test"])
					o(onFail.callCount).equals(0)
				})
			})
			
			o.spec("getPath", function() {
				o("gets route", function() {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}}, onRouteChange, onFail)
					
					o(router.getPath()).equals("/test")
				})
				o("gets route w/ params", function() {
					$window.location.href = prefix + "/other/x/y/z?c=d#e=f"
					router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)
					
					o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
				})
			})
			
			o.spec("setPath", function() {
				o("sets route via API", function() {
					$window.location.href = prefix + "/test"
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
					
					o($window.location.href).equals("http://localhost/" + (prefix ? prefix + "/" : "") + "test")
				})
			})
		})
	})
})