"use strict"

const o = require("ospec")
const components = require("../../test-utils/components")
const domMock = require("../../test-utils/domMock")
const vdom = require("../render")
const m = require("../hyperscript")
const fragment = require("../fragment")
const domFor = require("../../render/domFor").domFor

o.spec("domFor(vnode)", function() {
	let $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})
	o("works for simple vnodes", function() {
		render(root, m("div", {oncreate(vnode){
			let n = 0
			for (const dom of domFor(vnode)) {
				o(dom).equals(root.firstChild)
				o(++n).equals(1)
			}
		}}))
	})
	o("works for fragments", function () {
		render(root, fragment({
			oncreate(vnode){
				let n = 0
				for (const dom of domFor(vnode)) {
					o(dom).equals(root.childNodes[n])
					n++
				}
				o(n).equals(2)
			}
		}, [
			m("a"),
			m("b")
		]))
	})
	o("works in fragments with children that have delayed removal", function() {
		function oncreate(vnode){
			o(root.childNodes.length).equals(3)
			o(root.childNodes[0].nodeName).equals("A")
			o(root.childNodes[1].nodeName).equals("B")
			o(root.childNodes[2].nodeName).equals("C")

			const iter = domFor(vnode)
			o(iter.next()).deepEquals({done:false, value: root.childNodes[0]})
			o(iter.next()).deepEquals({done:false, value: root.childNodes[1]})
			o(iter.next()).deepEquals({done:false, value: root.childNodes[2]})
			o(iter.next().done).deepEquals(true)
			o(root.childNodes.length).equals(3)
		}
		function onupdate(vnode) {
			// the b node is still present in the DOM
			o(root.childNodes.length).equals(3)
			o(root.childNodes[0].nodeName).equals("A")
			o(root.childNodes[1].nodeName).equals("B")
			o(root.childNodes[2].nodeName).equals("C")

			const iter = domFor(vnode)
			o(iter.next()).deepEquals({done:false, value: root.childNodes[0]})
			o(iter.next()).deepEquals({done:false, value: root.childNodes[2]})
			o(iter.next().done).deepEquals(true)
			o(root.childNodes.length).equals(3)
		}

		render(root, fragment(
			{oncreate, onupdate},
			[
				m("a"),
				m("b", {onbeforeremove(){return {then(){}, finally(){}}}}),
				m("c")
			]
		))
		render(root, fragment(
			{oncreate, onupdate},
			[
				m("a"),
				null,
				m("c"),
			]
		))

	})
	components.forEach(function(cmp){
		const {kind, create: createComponent} = cmp
		o.spec(kind, function(){
			o("works for components that return one element", function() {
				const C = createComponent({
					view(){return m("div")},
					oncreate(vnode){
						let n = 0
						for (const dom of domFor(vnode)) {
							o(dom).equals(root.firstChild)
							o(++n).equals(1)
						}
					}
				})
				render(root, m(C))
			})
			o("works for components that return fragments", function () {
				const oncreate = o.spy(function oncreate(vnode){
					o(root.childNodes.length).equals(3)
					o(root.childNodes[0].nodeName).equals("A")
					o(root.childNodes[1].nodeName).equals("B")
					o(root.childNodes[2].nodeName).equals("C")

					const iter = domFor(vnode)
					o(iter.next()).deepEquals({done:false, value: root.childNodes[0]})
					o(iter.next()).deepEquals({done:false, value: root.childNodes[1]})
					o(iter.next()).deepEquals({done:false, value: root.childNodes[2]})
					o(iter.next().done).deepEquals(true)
					o(root.childNodes.length).equals(3)
				})
				const C = createComponent({
					view({children}){return children},
					oncreate
				})
				render(root, m(C, [
					m("a"),
					m("b"),
					m("c")
				]))
				o(oncreate.callCount).equals(1)
			})
			o("works for components that return fragments with delayed removal", function () {
				const onbeforeremove = o.spy(function onbeforeremove(){return {then(){}, finally(){}}})
				const oncreate = o.spy(function oncreate(vnode){
					o(root.childNodes.length).equals(3)
					o(root.childNodes[0].nodeName).equals("A")
					o(root.childNodes[1].nodeName).equals("B")
					o(root.childNodes[2].nodeName).equals("C")

					const iter = domFor(vnode)
					o(iter.next()).deepEquals({done:false, value: root.childNodes[0]})
					o(iter.next()).deepEquals({done:false, value: root.childNodes[1]})
					o(iter.next()).deepEquals({done:false, value: root.childNodes[2]})
					o(iter.next().done).deepEquals(true)
					o(root.childNodes.length).equals(3)
				})
				const onupdate = o.spy(function onupdate(vnode) {
					o(root.childNodes.length).equals(3)
					o(root.childNodes[0].nodeName).equals("A")
					o(root.childNodes[1].nodeName).equals("B")
					o(root.childNodes[2].nodeName).equals("C")

					const iter = domFor(vnode)

					o(iter.next()).deepEquals({done:false, value: root.childNodes[0]})
					o(iter.next()).deepEquals({done:false, value: root.childNodes[2]})
					o(iter.next().done).deepEquals(true)
					o(root.childNodes.length).equals(3)
				})
				const C = createComponent({
					view({children}){return children},
					oncreate,
					onupdate
				})
				render(root, m(C, [
					m("a"),
					m("b", {onbeforeremove}),
					m("c")
				]))
				render(root, m(C, [
					m("a"),
					null,
					m("c")
				]))
				o(oncreate.callCount).equals(1)
				o(onupdate.callCount).equals(1)
				o(onbeforeremove.callCount).equals(1)
			})
		})
	})
})