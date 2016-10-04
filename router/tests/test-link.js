"use strict"

var o = require("../../ospec/ospec")
var renderService = require("../../render/render")
var callAsync = require("../../test-utils/callAsync")
var pushStateMock = require("../../test-utils/pushStateMock")
var domMock = require("../../test-utils/domMock")
var Router = require("../../router/router")

o.spec("Router.link", function() {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}].forEach(function(env) {
		void ["#", "?", "", "#!", "?!", "/foo"].forEach(function(prefix) {
			o.spec("using prefix `" + prefix + "` starting on " + env.protocol + "//" + env.hostname, function() {
				var $window, dom, root, router, onRouteChange, onFail, render

				o.beforeEach(function() {
					$window = pushStateMock(env)
					dom = domMock()
					root = dom.document.body
					router = new Router($window)
					router.setPrefix(prefix)
					onRouteChange = o.spy()
					onFail = o.spy()
					render = renderService(dom).render
				})

				o("works", function(done) {
					var A = {
						view: function() {
							return {tag: "a", attrs: {href: "/b", oncreate: router.link}}
						}
					}
					var B = {
						view: function() {
							return {tag: "a", attrs: {href: "/a", oncreate: router.link}}
						}
					}
					
					$window.location.href = prefix + "/a"
					router.defineRoutes({"/a": {tag: A}, "/b": {tag: B}}, function(component) {
						render(root, component)
					})
										
					callAsync(function() {
						var e = dom.document.createEvent("MouseEvents")
						e.initEvent("click", true, true)
						root.firstChild.dispatchEvent(e)
						
						callAsync(function() {
							o(router.getPath()).equals("/b")
							
							done()
						})
					})
				})

				o("works after update", function(done) {
					var id = "a"
					var A = {
						view: function() {
							return {tag: "a", attrs: {href: "/" + id, oncreate: router.link}}
						}
					}
					
					$window.location.href = prefix + "/a"
					router.defineRoutes({"/a": {tag: A}, "/b": {tag: A}}, function(component) {
						render(root, {tag: A})
						id = "b"
						render(root, {tag: A})
					})
										
					callAsync(function() {
						var e = dom.document.createEvent("MouseEvents")
						e.initEvent("click", true, true)
						root.firstChild.dispatchEvent(e)
						
						callAsync(function() {
							o(router.getPath()).equals("/b")
							
							done()
						})
					})
				})
			})
		})
	})
})
