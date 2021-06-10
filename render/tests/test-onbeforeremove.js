"use strict"

var o = require("ospec")
var callAsync = require("../../test-utils/callAsync")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var Promise = require("../../promise/promise")
var m = require("../../render/hyperscript")
var fragment = require("../../render/fragment")

o.spec("onbeforeremove", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("does not call onbeforeremove when creating", function() {
		var create = o.spy()
		var vnode = m("div", {onbeforeremove: create})

		render(root, vnode)

		o(create.callCount).equals(0)
	})
	o("does not call onbeforeremove when updating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onbeforeremove: create})
		var updated = m("div", {onbeforeremove: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("calls onbeforeremove when removing element", function(done) {
		var vnode = m("div", {onbeforeremove: remove})

		render(root, vnode)
		render(root, [])

		function remove(node) {
			o(node).equals(vnode)
			o(this).equals(vnode.state)
			o(this != null && typeof this === "object").equals(true)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)

			callAsync(function() {
				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls onbeforeremove when removing fragment", function(done) {
		var vnode = fragment({onbeforeremove: remove}, m("div"))

		render(root, vnode)
		render(root, [])

		function remove(node) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)

			callAsync(function() {
				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls remove after onbeforeremove resolves", function(done) {
		var spy = o.spy()
		var vnode = fragment({onbeforeremove: remove, onremove: spy}, "a")

		render(root, vnode)
		render(root, [])

		function remove(node) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)

			callAsync(function() {
				o(root.childNodes.length).equals(0)
				o(spy.callCount).equals(1)

				done()
			})
		}
	})
	o("does not set onbeforeremove as an event handler", function() {
		var remove = o.spy()
		var vnode = m("div", {onbeforeremove: remove})

		render(root, vnode)

		o(vnode.dom.onbeforeremove).equals(undefined)
		o(vnode.dom.attributes["onbeforeremove"]).equals(undefined)
	})
	o("does not recycle when there's an onbeforeremove", function() {
		var remove = function() {}
		var vnode = m("div", {key: 1, onbeforeremove: remove})
		var updated = m("div", {key: 1, onbeforeremove: remove})

		render(root, vnode)
		render(root, [])
		render(root, updated)

		o(vnode.dom).notEquals(updated.dom)
	})
	o("does not leave elements out of order during removal", function(done) {
		var remove = function() {return Promise.resolve()}
		var vnodes = [m("div", {key: 1, onbeforeremove: remove}, "1"), m("div", {key: 2, onbeforeremove: remove}, "2")]
		var updated = m("div", {key: 2, onbeforeremove: remove}, "2")

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.firstChild.firstChild.nodeValue).equals("1")

		callAsync(function() {
			o(root.childNodes.length).equals(1)
			o(root.firstChild.firstChild.nodeValue).equals("2")

			done()
		})
	})
	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create
			o("finalizes the remove phase asynchronously when promise is returned synchronously from both attrs- and tag.onbeforeremove", function(done) {
				var onremove = o.spy()
				var onbeforeremove = function(){return Promise.resolve()}
				var component = createComponent({
					onbeforeremove: onbeforeremove,
					onremove: onremove,
					view: function() {},
				})
				render(root, m(component, {onbeforeremove: onbeforeremove, onremove: onremove}))
				render(root, [])
				callAsync(function() {
					o(onremove.callCount).equals(2) // once for `tag`, once for `attrs`
					done()
				})
			})
			o("awaits promise resolution before removing the node", function(done) {
				var view = o.spy()
				var onremove = o.spy()
				var onbeforeremove = function(){return new Promise(function(resolve){callAsync(resolve)})}
				var component = createComponent({
					onbeforeremove: onbeforeremove,
					onremove: onremove,
					view: view,
				})
				render(root, m(component))
				render(root, [])

				o(onremove.callCount).equals(0)
				callAsync(function(){
					callAsync(function() {
						o(onremove.callCount).equals(1)
						done()
					})
				})
			})
		})
	})
})
