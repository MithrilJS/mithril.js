"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var render = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("onremove", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("does not call onremove when creating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onremove: create})
		var updated = m("div", {onremove: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
	})
	o("does not call onremove when updating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onremove: create})
		var updated = m("div", {onremove: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("calls onremove when removing element", function() {
		var remove = o.spy()
		var vnode = m("div", {onremove: remove})

		render(root, vnode)
		render(root, [])

		o(remove.callCount).equals(1)
		o(remove.this).equals(vnode.state)
		o(remove.args[0]).equals(vnode)
	})
	o("calls onremove when removing fragment", function() {
		var remove = o.spy()
		var vnode = m.fragment({onremove: remove})

		render(root, vnode)
		render(root, [])

		o(remove.callCount).equals(1)
		o(remove.this).equals(vnode.state)
		o(remove.args[0]).equals(vnode)
	})
	o("does not set onremove as an event handler", function() {
		var remove = o.spy()
		var vnode = m("div", {onremove: remove})

		render(root, vnode)

		o(vnode.dom.onremove).equals(undefined)
		o(vnode.dom.attributes["onremove"]).equals(undefined)
		o(vnode.instance).equals(undefined)
	})
	o("calls onremove on keyed nodes", function() {
		var remove = o.spy()
		var vnode = m("div")
		var temp = m("div", {onremove: remove})
		var updated = m("div")

		render(root, m.key(1, vnode))
		render(root, m.key(2, temp))
		render(root, m.key(1, updated))

		o(vnode.dom).notEquals(updated.dom) // this used to be a recycling pool test
		o(remove.callCount).equals(1)
	})
	o("does not recycle when there's an onremove", function() {
		var remove = o.spy()
		var vnode = m("div", {onremove: remove})
		var updated = m("div", {onremove: remove})

		render(root, m.key(1, vnode))
		render(root, [])
		render(root, m.key(1, updated))

		o(vnode.dom).notEquals(updated.dom)
	})
	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create

			o("calls onremove on nested component", function() {
				var spy = o.spy()
				var comp = createComponent({
					view: function() {return m(outer)}
				})
				var outer = createComponent({
					view: function() {return m(inner)}
				})
				var inner = createComponent({
					onremove: spy,
					view: function() {return m("div")}
				})
				render(root, m(comp))
				render(root, null)

				o(spy.callCount).equals(1)
			})
			o("calls onremove on nested component child", function() {
				var spy = o.spy()
				var comp = createComponent({
					view: function() {return m(outer)}
				})
				var outer = createComponent({
					view: function() {return m(inner, m("a", {onremove: spy}))}
				})
				var inner = createComponent({
					view: function(vnode) {return m("div", vnode.children)}
				})
				render(root, m(comp))
				render(root, null)

				o(spy.callCount).equals(1)
			})
			o("doesn't call onremove on children when the corresponding view returns null (after removing the parent)", function() {
				var threw = false
				var spy = o.spy()
				var parent = createComponent({
					view: function() {}
				})
				var child = createComponent({
					view: function() {},
					onremove: spy
				})
				render(root, m(parent, m(child)))
				try {
					render(root, null)
				} catch (e) {
					threw = e
				}

				o(spy.callCount).equals(0)
				o(threw).equals(false)
			})
			o("doesn't call onremove on children when the corresponding view returns null (after removing the children)", function() {
				var threw = false
				var spy = o.spy()
				var parent = createComponent({
					view: function() {}
				})
				var child = createComponent({
					view: function() {},
					onremove: spy
				})
				render(root, m(parent, m(child)))
				try {
					render(root, m(parent))
				} catch (e) {
					threw = true
				}

				o(spy.callCount).equals(0)
				o(threw).equals(false)
			})
			o("onremove doesn't fire on nodes that go from pool to pool (#1990)", function() {
				var onremove = o.spy();

				render(root, [m("div", m("div")), m("div", m("div", {onremove: onremove}))]);
				render(root, [m("div", m("div"))]);
				render(root, []);

				o(onremove.callCount).equals(1)
			})
			o("doesn't fire when removing the children of a node that's brought back from the pool (#1991 part 2)", function() {
				var onremove = o.spy()
				var vnode = m("div", m("div", {onremove: onremove}))
				var temp = m("div")
				var updated = m("div", m("p"))

				render(root, m.key(1, vnode))
				render(root, m.key(2, temp))
				render(root, m.key(1, updated))

				o(vnode.dom).notEquals(updated.dom) // this used to be a recycling pool test
				o(onremove.callCount).equals(1)
			})
			// Warning: this test is complicated because it's replicating a race condition.
			o("removes correct nodes in fragment when child delays removal, parent removes, then child resolves", function () {
				var resumeAttr1, resumeMethod1, resumeAttr2, resumeMethod2
				var attrRemoved1 = new Promise((resolve) => resumeAttr1 = resolve)
				var methodRemoved1 = new Promise((resolve) => resumeMethod1 = resolve)
				var attrRemoved2 = new Promise((resolve) => resumeAttr2 = resolve)
				var methodRemoved2 = new Promise((resolve) => resumeMethod2 = resolve)
				var calls = []

				var methodCalled = false
				var C = createComponent({
					view: (v) => v.children,
					onremove() { calls.push("component method onremove") },
					onbeforeremove() {
						calls.push("component method onbeforeremove")
						if (methodCalled) return methodRemoved2
						methodCalled = true
						return methodRemoved1
					},
				})

				render(root, m("div", m.fragment({onremove() { calls.push("parent onremove") }},
					m("a", {onremove() { calls.push("child sync onremove") }}),
					m(C, {
						onbeforeremove() { calls.push("component attr onbeforeremove"); return attrRemoved1 },
						onremove() { calls.push("component attr onremove") },
					}, m("span"))
				)))

				o(calls).deepEquals([])
				o(root.childNodes.length).equals(1)
				o(root.childNodes[0].nodeName).equals("DIV")
				o(root.childNodes[0].childNodes.length).equals(2)
				o(root.childNodes[0].childNodes[0].nodeName).equals("A")
				o(root.childNodes[0].childNodes[1].nodeName).equals("SPAN")

				render(root, m("div", m.fragment({onremove() { calls.push("parent onremove") }},
					m("a", {onremove() { calls.push("child sync onremove") }})
				)))

				o(calls).deepEquals([
					"component method onbeforeremove",
					"component attr onbeforeremove",
				])
				o(root.childNodes.length).equals(1)
				o(root.childNodes[0].nodeName).equals("DIV")
				o(root.childNodes[0].childNodes.length).equals(2)
				o(root.childNodes[0].childNodes[0].nodeName).equals("A")
				o(root.childNodes[0].childNodes[1].nodeName).equals("SPAN")
				var firstRemoved = root.childNodes[0].childNodes[1]

				render(root, m("div", m.fragment({onremove() { calls.push("parent onremove") }},
					m("a", {onremove() { calls.push("child sync onremove") }}),
					m(C, {
						onbeforeremove() { calls.push("component attr onbeforeremove"); return attrRemoved2 },
						onremove() { calls.push("component attr onremove") },
					}, m("span"))
				)))

				o(calls).deepEquals([
					"component method onbeforeremove",
					"component attr onbeforeremove",
				])
				o(root.childNodes.length).equals(1)
				o(root.childNodes[0].nodeName).equals("DIV")
				o(root.childNodes[0].childNodes.length).equals(3)
				o(root.childNodes[0].childNodes[0].nodeName).equals("A")
				o(root.childNodes[0].childNodes[1]).equals(firstRemoved)
				o(root.childNodes[0].childNodes[2].nodeName).equals("SPAN")
				var secondRemoved = root.childNodes[0].childNodes[2]

				render(root, m("div"))

				o(calls).deepEquals([
					"component method onbeforeremove",
					"component attr onbeforeremove",
					"child sync onremove",
					"component method onbeforeremove",
					"component attr onbeforeremove",
				])
				o(root.childNodes.length).equals(1)
				o(root.childNodes[0].nodeName).equals("DIV")
				o(root.childNodes[0].childNodes.length).equals(2)
				o(root.childNodes[0].childNodes[0]).equals(firstRemoved)
				o(root.childNodes[0].childNodes[1]).equals(secondRemoved)

				render(root, m("div", m.fragment({onremove() { calls.push("unexpected parent onremove") }},
					m("a", {onremove() { calls.push("unexpected child sync onremove") }}),
					m(C, {
						onbeforeremove() { calls.push("unexpected component attr onbeforeremove") },
						onremove() { calls.push("unexpected component attr onremove") },
					}, m("span"))
				)))

				// No change
				o(calls).deepEquals([
					"component method onbeforeremove",
					"component attr onbeforeremove",
					"child sync onremove",
					"component method onbeforeremove",
					"component attr onbeforeremove",
				])
				o(root.childNodes.length).equals(1)
				o(root.childNodes[0].nodeName).equals("DIV")
				o(root.childNodes[0].childNodes.length).equals(4)
				o(root.childNodes[0].childNodes[0]).equals(firstRemoved)
				o(root.childNodes[0].childNodes[1]).equals(secondRemoved)
				o(root.childNodes[0].childNodes[2].nodeName).equals("A")
				o(root.childNodes[0].childNodes[3].nodeName).equals("SPAN")

				render(root, m("div", m.fragment({onremove() { calls.push("unexpected parent onremove") }},
					m("a", {onremove() { calls.push("unexpected child sync onremove") }}),
					m(C, {
						onbeforeremove() { calls.push("unexpected component attr onbeforeremove") },
						onremove() { calls.push("unexpected component attr onremove") },
					}, m("span"))
				)))

				// No change
				o(calls).deepEquals([
					"component method onbeforeremove",
					"component attr onbeforeremove",
					"child sync onremove",
					"component method onbeforeremove",
					"component attr onbeforeremove",
				])
				o(root.childNodes.length).equals(1)
				o(root.childNodes[0].nodeName).equals("DIV")
				o(root.childNodes[0].childNodes.length).equals(4)
				o(root.childNodes[0].childNodes[0]).equals(firstRemoved)
				o(root.childNodes[0].childNodes[1]).equals(secondRemoved)
				o(root.childNodes[0].childNodes[2].nodeName).equals("A")
				o(root.childNodes[0].childNodes[3].nodeName).equals("SPAN")

				resumeAttr1()

				return attrRemoved1
					.then(() => {
						// No change
						o(calls).deepEquals([
							"component method onbeforeremove",
							"component attr onbeforeremove",
							"child sync onremove",
							"component method onbeforeremove",
							"component attr onbeforeremove",
						])
						o(root.childNodes.length).equals(1)
						o(root.childNodes[0].nodeName).equals("DIV")
						o(root.childNodes[0].childNodes.length).equals(4)
						o(root.childNodes[0].childNodes[0]).equals(firstRemoved)
						o(root.childNodes[0].childNodes[1]).equals(secondRemoved)
						o(root.childNodes[0].childNodes[2].nodeName).equals("A")
						o(root.childNodes[0].childNodes[3].nodeName).equals("SPAN")

						resumeAttr2()
						return attrRemoved2
					})
					.then(() => {
						// No change
						o(calls).deepEquals([
							"component method onbeforeremove",
							"component attr onbeforeremove",
							"child sync onremove",
							"component method onbeforeremove",
							"component attr onbeforeremove",
						])
						o(root.childNodes.length).equals(1)
						o(root.childNodes[0].nodeName).equals("DIV")
						o(root.childNodes[0].childNodes.length).equals(4)
						o(root.childNodes[0].childNodes[0]).equals(firstRemoved)
						o(root.childNodes[0].childNodes[1]).equals(secondRemoved)
						o(root.childNodes[0].childNodes[2].nodeName).equals("A")
						o(root.childNodes[0].childNodes[3].nodeName).equals("SPAN")

						resumeMethod1()
						return methodRemoved1
					})
					.then(() => {
						// No change
						o(calls).deepEquals([
							"component method onbeforeremove",
							"component attr onbeforeremove",
							"child sync onremove",
							"component method onbeforeremove",
							"component attr onbeforeremove",
							"component method onremove",
							"component attr onremove",
						])
						o(root.childNodes.length).equals(1)
						o(root.childNodes[0].nodeName).equals("DIV")
						o(root.childNodes[0].childNodes.length).equals(3)
						o(root.childNodes[0].childNodes[0]).equals(secondRemoved)
						o(root.childNodes[0].childNodes[1].nodeName).equals("A")
						o(root.childNodes[0].childNodes[2].nodeName).equals("SPAN")

						resumeMethod2()
						return methodRemoved2
					})
					.then(() => {
						// Now, everything should be cleaned up
						o(calls).deepEquals([
							"component method onbeforeremove",
							"component attr onbeforeremove",
							"child sync onremove",
							"component method onbeforeremove",
							"component attr onbeforeremove",
							"component method onremove",
							"component attr onremove",
							"component method onremove",
							"component attr onremove",
						])
						o(root.childNodes.length).equals(1)
						o(root.childNodes[0].nodeName).equals("DIV")
						o(root.childNodes[0].childNodes.length).equals(2)
						o(root.childNodes[0].childNodes[0].nodeName).equals("A")
						o(root.childNodes[0].childNodes[1].nodeName).equals("SPAN")
					})
			})
		})
	})
})
