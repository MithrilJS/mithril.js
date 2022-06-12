"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var fragment = require("../../render/fragment")

o.spec("onremove", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
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
		var vnode = fragment({onremove: remove})

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
		o(vnode.events).equals(undefined)
	})
	o("calls onremove on keyed nodes", function() {
		var remove = o.spy()
		var vnodes = [m("div", {key: 1})]
		var temp = [m("div", {key: 2, onremove: remove})]
		var updated = [m("div", {key: 1})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(vnodes[0].dom).notEquals(updated[0].dom) // this used to be a recycling pool test
		o(remove.callCount).equals(1)
	})
	o("does not recycle when there's an onremove", function() {
		var remove = o.spy()
		var vnode = m("div", {key: 1, onremove: remove})
		var updated = m("div", {key: 1, onremove: remove})

		render(root, vnode)
		render(root, [])
		render(root, updated)

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
				var vnode = m("div", {key: 1}, m("div", {onremove: onremove}))
				var temp = m("div", {key: 2})
				var updated = m("div", {key: 1}, m("p"))

				render(root, vnode)
				render(root, temp)
				render(root, updated)

				o(vnode.dom).notEquals(updated.dom) // this used to be a recycling pool test
				o(onremove.callCount).equals(1)
			})
			// Warning: this test is complicated because it's replicating a race condition.
			o("removes correct nodes in fragment when child delays removal, parent removes, then child resolves", function () {
				// Custom assertion - we need to test the entire tree for consistency.

				const template = (tpl) => (root) => {
					var expected = []

					for (var i = 0; i < tpl.length; i++) {
						var name = tpl[i][0]
						var text = tpl[i][1]
						expected.push({
							name: name,
							firstType: name === "#text" ? null : "#text",
							text: text,
						})
					}

					var actual = []
					var list = root.firstChild.childNodes
					for (var i = 0; i < list.length; i++) {
						var current = list[i]
						var textNode = current.childNodes.length === 1
							? current.firstChild
							: current
						actual.push({
							name: current.nodeName,
							firstType: textNode === current ? null : textNode.nodeName,
							text: textNode.nodeValue,
						})
					}
					actual = JSON.stringify(actual, null, "  ")
					expected = JSON.stringify(expected, null, "  ")
					return {
						pass: actual === expected,
						message:
`${expected}
  expected, got
${actual}`
					}
				}
				var finallyCB1
				var finallyCB2
				var C = createComponent({
					view({children}){return children},
					onbeforeremove(){
						return {then(){}, finally: function (fcb) { finallyCB1 = fcb }}
					}
				})
				function update(id, showParent, showChild) {
					const removeParent = o.spy()
					const removeSyncChild = o.spy()
					const removeAsyncChild = o.spy()

					render(root,
						m("div",
							showParent && fragment(
								{onremove: removeParent},
								m("a", {onremove: removeSyncChild}, "sync child"),
								showChild && m(C, {
									onbeforeremove: function () {
										return {then(){}, finally: function (fcb) { finallyCB2 = fcb }}
									},
									onremove: removeAsyncChild
								}, m("div", id))
							)
						)
					)
					return {removeAsyncChild,removeParent, removeSyncChild}
				}

				const hooks1 = update("1", true, true)
				o(root).satisfies(template([
					["A", "sync child"],
					["DIV", "1"],
				]))
				o(finallyCB1).equals(undefined)
				o(finallyCB2).equals(undefined)

				const hooks2 = update("2", true, false)

				o(root).satisfies(template([
					["A", "sync child"],
					["DIV", "1"],
				]))

				o(typeof finallyCB1).equals("function")
				o(typeof finallyCB2).equals("function")

				var original1 = finallyCB1
				var original2 = finallyCB2

				const hooks3 = update("3", true, true)

				o(root).satisfies(template([
					["A", "sync child"],
					["DIV", "1"],
					["DIV", "3"],
				]))

				o(hooks3.removeParent.callCount).equals(0)
				o(hooks3.removeSyncChild.callCount).equals(0)
				o(hooks3.removeAsyncChild.callCount).equals(0)
				o(finallyCB1).equals(original1)
				o(finallyCB2).equals(original2)

				const hooks4 = update("4", false, true)

				o(root).satisfies(template([
					["DIV", "1"],
				]))

				o(hooks3.removeParent.callCount).equals(1)
				o(hooks3.removeSyncChild.callCount).equals(1)
				o(hooks3.removeAsyncChild.callCount).equals(1)
				o(hooks3.removeParent.args[0].tag).equals("[")
				o(finallyCB1).equals(original1)
				o(finallyCB2).equals(original2)

				const hooks5 = update("5", true, true)


				o(root).satisfies(template([
					["DIV", "1"],
					["A", "sync child"],
					["DIV", "5"],
				]))
				o(finallyCB1).equals(original1)
				o(finallyCB2).equals(original2)

				o(hooks1.removeAsyncChild.callCount).equals(0)

				finallyCB1()

				o(hooks1.removeAsyncChild.callCount).equals(0)

				finallyCB2()

				o(hooks1.removeAsyncChild.callCount).equals(1)

				o(root).satisfies(template([
					["A", "sync child"],
					["DIV", "5"],
				]))
				o(finallyCB1).equals(original1)
				o(finallyCB2).equals(original2)

				const hooks6 = update("6", true, true)

				o(root).satisfies(template([
					["A", "sync child"],
					["DIV", "6"],
				]))
				o(finallyCB1).equals(original1)
				o(finallyCB2).equals(original2)

				// final tally
				o(hooks1.removeParent.callCount).equals(0)
				o(hooks1.removeSyncChild.callCount).equals(0)
				o(hooks1.removeAsyncChild.callCount).equals(1)

				o(hooks2.removeParent.callCount).equals(0)
				o(hooks2.removeSyncChild.callCount).equals(0)
				o(hooks2.removeAsyncChild.callCount).equals(0)

				o(hooks3.removeParent.callCount).equals(1)
				o(hooks3.removeSyncChild.callCount).equals(1)
				o(hooks3.removeAsyncChild.callCount).equals(1)

				o(hooks4.removeParent.callCount).equals(0)
				o(hooks4.removeSyncChild.callCount).equals(0)
				o(hooks4.removeAsyncChild.callCount).equals(0)

				o(hooks5.removeParent.callCount).equals(0)
				o(hooks5.removeSyncChild.callCount).equals(0)
				o(hooks5.removeAsyncChild.callCount).equals(0)

				o(hooks6.removeParent.callCount).equals(0)
				o(hooks6.removeSyncChild.callCount).equals(0)
				o(hooks6.removeAsyncChild.callCount).equals(0)

			})
		})
	})
})
