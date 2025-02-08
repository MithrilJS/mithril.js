"use strict"

const o = require("ospec")
const callAsync = require("../../test-utils/callAsync")
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
	o("works in onbeforeremove and onremove", function (done) {
		const onbeforeremove = o.spy(function onbeforeremove(vnode){
			o(root.childNodes.length).equals(1)
			o(root.childNodes[0].nodeName).equals("A")
			const iter = domFor(vnode)
			o(iter.next()).deepEquals({done:false, value: root.childNodes[0]})
			o(iter.next().done).deepEquals(true)
			o(root.childNodes.length).equals(1)
			return {then(resolve){resolve()}}
		})
		const onremove = o.spy(function onremove(vnode){
			o(root.childNodes.length).equals(1)
			o(root.childNodes[0].nodeName).equals("A")
			const iter = domFor(vnode)
			o(iter.next()).deepEquals({done:false, value: root.childNodes[0]})
			o(iter.next().done).deepEquals(true)
			o(root.childNodes.length).equals(1)
		})
		render(root, [m("a", {onbeforeremove, onremove})])
		render(root, [])

		o(onbeforeremove.callCount).equals(1)
		o(onremove.callCount).equals(0)
		callAsync(function(){
			o(onremove.callCount).equals(1)
			done()
		})
	})
	o("works multiple vnodes with onbeforeremove (#3007, 1/6, BCA)", function (done) {
		let thenCBA, thenCBB, thenCBC
		const onbeforeremoveA = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBA = resolve}}
		})
		const onbeforeremoveB = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBB = resolve}}
		})
		const onbeforeremoveC = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBC = resolve}}
		})
		// to avoid updating internal nodes only, vnodes have key attributes
		const A = fragment({key: 1, onbeforeremove: onbeforeremoveA}, [m("a1"), m("a2")])
		const B = fragment({key: 2, onbeforeremove: onbeforeremoveB}, [m("b1"), m("b2")])
		const C = fragment({key: 3, onbeforeremove: onbeforeremoveC}, [m("c1"), m("c2")])

		render(root, [A])
		o(onbeforeremoveA.callCount).equals(0)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [B])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [C])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(1)

		// not resolved
		o(root.childNodes.length).equals(6)
		o(root.childNodes[0].nodeName).equals("A1")
		o(root.childNodes[1].nodeName).equals("A2")
		o(root.childNodes[2].nodeName).equals("B1")
		o(root.childNodes[3].nodeName).equals("B2")
		o(root.childNodes[4].nodeName).equals("C1")
		o(root.childNodes[5].nodeName).equals("C2")

		const iterA = domFor(A)
		o(iterA.next().value.nodeName).equals("A1")
		o(iterA.next().value.nodeName).equals("A2")
		o(iterA.next().done).deepEquals(true)

		const iterB = domFor(B)
		o(iterB.next().value.nodeName).equals("B1")
		o(iterB.next().value.nodeName).equals("B2")
		o(iterB.next().done).deepEquals(true)

		const iterC = domFor(C)
		o(iterC.next().value.nodeName).equals("C1")
		o(iterC.next().value.nodeName).equals("C2")
		o(iterC.next().done).deepEquals(true)

		callAsync(function(){
			// not resolved yet
			o(root.childNodes.length).equals(6)
			o(root.childNodes[0].nodeName).equals("A1")
			o(root.childNodes[1].nodeName).equals("A2")
			o(root.childNodes[2].nodeName).equals("B1")
			o(root.childNodes[3].nodeName).equals("B2")
			o(root.childNodes[4].nodeName).equals("C1")
			o(root.childNodes[5].nodeName).equals("C2")
	
			const iterA = domFor(A)
			o(iterA.next().value.nodeName).equals("A1")
			o(iterA.next().value.nodeName).equals("A2")
			o(iterA.next().done).deepEquals(true)
	
			const iterB = domFor(B)
			o(iterB.next().value.nodeName).equals("B1")
			o(iterB.next().value.nodeName).equals("B2")
			o(iterB.next().done).deepEquals(true)
	
			const iterC = domFor(C)
			o(iterC.next().value.nodeName).equals("C1")
			o(iterC.next().value.nodeName).equals("C2")
			o(iterC.next().done).deepEquals(true)

			// resolve B
			thenCBB()
			callAsync(function(){
				o(root.childNodes.length).equals(4)
				o(root.childNodes[0].nodeName).equals("A1")
				o(root.childNodes[1].nodeName).equals("A2")
				o(root.childNodes[2].nodeName).equals("C1")
				o(root.childNodes[3].nodeName).equals("C2")

				const iterA = domFor(A)
				o(iterA.next().value.nodeName).equals("A1")
				o(iterA.next().value.nodeName).equals("A2")
				o(iterA.next().done).deepEquals(true)

				const iterC = domFor(C)
				o(iterC.next().value.nodeName).equals("C1")
				o(iterC.next().value.nodeName).equals("C2")
				o(iterC.next().done).deepEquals(true)

				// resolve C
				thenCBC()
				callAsync(function(){
					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("A1")
					o(root.childNodes[1].nodeName).equals("A2")

					const iterA = domFor(A)
					o(iterA.next().value.nodeName).equals("A1")
					o(iterA.next().value.nodeName).equals("A2")
					o(iterA.next().done).deepEquals(true)

					// resolve A
					thenCBA()
					callAsync(function(){
						o(root.childNodes.length).equals(0)
						done()
					})
				})
			})
		})
	})
	o("works multiple vnodes with onbeforeremove (#3007, 2/6, CAB)", function (done) {
		let thenCBA, thenCBB, thenCBC
		const onbeforeremoveA = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBA = resolve}}
		})
		const onbeforeremoveB = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBB = resolve}}
		})
		const onbeforeremoveC = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBC = resolve}}
		})
		// to avoid updating internal nodes only, vnodes have key attributes
		const A = fragment({key: 1, onbeforeremove: onbeforeremoveA}, [m("a1"), m("a2")])
		const B = fragment({key: 2, onbeforeremove: onbeforeremoveB}, [m("b1"), m("b2")])
		const C = fragment({key: 3, onbeforeremove: onbeforeremoveC}, [m("c1"), m("c2")])

		render(root, [A])
		o(onbeforeremoveA.callCount).equals(0)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [B])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [C])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(1)

		// not resolved
		o(root.childNodes.length).equals(6)
		o(root.childNodes[0].nodeName).equals("A1")
		o(root.childNodes[1].nodeName).equals("A2")
		o(root.childNodes[2].nodeName).equals("B1")
		o(root.childNodes[3].nodeName).equals("B2")
		o(root.childNodes[4].nodeName).equals("C1")
		o(root.childNodes[5].nodeName).equals("C2")

		const iterA = domFor(A)
		o(iterA.next().value.nodeName).equals("A1")
		o(iterA.next().value.nodeName).equals("A2")
		o(iterA.next().done).deepEquals(true)

		const iterB = domFor(B)
		o(iterB.next().value.nodeName).equals("B1")
		o(iterB.next().value.nodeName).equals("B2")
		o(iterB.next().done).deepEquals(true)

		const iterC = domFor(C)
		o(iterC.next().value.nodeName).equals("C1")
		o(iterC.next().value.nodeName).equals("C2")
		o(iterC.next().done).deepEquals(true)

		callAsync(function(){
			// not resolved yet
			o(root.childNodes.length).equals(6)
			o(root.childNodes[0].nodeName).equals("A1")
			o(root.childNodes[1].nodeName).equals("A2")
			o(root.childNodes[2].nodeName).equals("B1")
			o(root.childNodes[3].nodeName).equals("B2")
			o(root.childNodes[4].nodeName).equals("C1")
			o(root.childNodes[5].nodeName).equals("C2")
	
			const iterA = domFor(A)
			o(iterA.next().value.nodeName).equals("A1")
			o(iterA.next().value.nodeName).equals("A2")
			o(iterA.next().done).deepEquals(true)
	
			const iterB = domFor(B)
			o(iterB.next().value.nodeName).equals("B1")
			o(iterB.next().value.nodeName).equals("B2")
			o(iterB.next().done).deepEquals(true)
	
			const iterC = domFor(C)
			o(iterC.next().value.nodeName).equals("C1")
			o(iterC.next().value.nodeName).equals("C2")
			o(iterC.next().done).deepEquals(true)

			// resolve C
			thenCBC()
			callAsync(function(){
				o(root.childNodes.length).equals(4)
				o(root.childNodes[0].nodeName).equals("A1")
				o(root.childNodes[1].nodeName).equals("A2")
				o(root.childNodes[2].nodeName).equals("B1")
				o(root.childNodes[3].nodeName).equals("B2")

				const iterB = domFor(B)
				o(iterB.next().value.nodeName).equals("B1")
				o(iterB.next().value.nodeName).equals("B2")
				o(iterB.next().done).deepEquals(true)

				const iterA = domFor(A)
				o(iterA.next().value.nodeName).equals("A1")
				o(iterA.next().value.nodeName).equals("A2")
				o(iterA.next().done).deepEquals(true)

				// resolve A
				thenCBA()
				callAsync(function(){
					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("B1")
					o(root.childNodes[1].nodeName).equals("B2")

					const iterB = domFor(B)
					o(iterB.next().value.nodeName).equals("B1")
					o(iterB.next().value.nodeName).equals("B2")
					o(iterB.next().done).deepEquals(true)

					// resolve B
					thenCBB()
					callAsync(function(){
						o(root.childNodes.length).equals(0)
						done()
					})
				})
			})
		})
	})
	o("works multiple vnodes with onbeforeremove (#3007, 3/6, ABC)", function (done) {
		let thenCBA, thenCBB, thenCBC
		const onbeforeremoveA = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBA = resolve}}
		})
		const onbeforeremoveB = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBB = resolve}}
		})
		const onbeforeremoveC = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBC = resolve}}
		})
		// to avoid updating internal nodes only, vnodes have key attributes
		const A = fragment({key: 1, onbeforeremove: onbeforeremoveA}, [m("a1"), m("a2")])
		const B = fragment({key: 2, onbeforeremove: onbeforeremoveB}, [m("b1"), m("b2")])
		const C = fragment({key: 3, onbeforeremove: onbeforeremoveC}, [m("c1"), m("c2")])

		render(root, [A])
		o(onbeforeremoveA.callCount).equals(0)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [B])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [C])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(1)

		// not resolved
		o(root.childNodes.length).equals(6)
		o(root.childNodes[0].nodeName).equals("A1")
		o(root.childNodes[1].nodeName).equals("A2")
		o(root.childNodes[2].nodeName).equals("B1")
		o(root.childNodes[3].nodeName).equals("B2")
		o(root.childNodes[4].nodeName).equals("C1")
		o(root.childNodes[5].nodeName).equals("C2")

		const iterA = domFor(A)
		o(iterA.next().value.nodeName).equals("A1")
		o(iterA.next().value.nodeName).equals("A2")
		o(iterA.next().done).deepEquals(true)

		const iterB = domFor(B)
		o(iterB.next().value.nodeName).equals("B1")
		o(iterB.next().value.nodeName).equals("B2")
		o(iterB.next().done).deepEquals(true)

		const iterC = domFor(C)
		o(iterC.next().value.nodeName).equals("C1")
		o(iterC.next().value.nodeName).equals("C2")
		o(iterC.next().done).deepEquals(true)

		callAsync(function(){
			// not resolved yet
			o(root.childNodes.length).equals(6)
			o(root.childNodes[0].nodeName).equals("A1")
			o(root.childNodes[1].nodeName).equals("A2")
			o(root.childNodes[2].nodeName).equals("B1")
			o(root.childNodes[3].nodeName).equals("B2")
			o(root.childNodes[4].nodeName).equals("C1")
			o(root.childNodes[5].nodeName).equals("C2")
	
			const iterA = domFor(A)
			o(iterA.next().value.nodeName).equals("A1")
			o(iterA.next().value.nodeName).equals("A2")
			o(iterA.next().done).deepEquals(true)
	
			const iterB = domFor(B)
			o(iterB.next().value.nodeName).equals("B1")
			o(iterB.next().value.nodeName).equals("B2")
			o(iterB.next().done).deepEquals(true)
	
			const iterC = domFor(C)
			o(iterC.next().value.nodeName).equals("C1")
			o(iterC.next().value.nodeName).equals("C2")
			o(iterC.next().done).deepEquals(true)

			// resolve A
			thenCBA()
			callAsync(function(){
				o(root.childNodes.length).equals(4)
				o(root.childNodes[0].nodeName).equals("B1")
				o(root.childNodes[1].nodeName).equals("B2")
				o(root.childNodes[2].nodeName).equals("C1")
				o(root.childNodes[3].nodeName).equals("C2")

				const iterB = domFor(B)
				o(iterB.next().value.nodeName).equals("B1")
				o(iterB.next().value.nodeName).equals("B2")
				o(iterB.next().done).deepEquals(true)

				const iterC = domFor(C)
				o(iterC.next().value.nodeName).equals("C1")
				o(iterC.next().value.nodeName).equals("C2")
				o(iterC.next().done).deepEquals(true)

				// resolve B
				thenCBB()
				callAsync(function(){
					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("C1")
					o(root.childNodes[1].nodeName).equals("C2")
					
					const iterC = domFor(C)
					o(iterC.next().value.nodeName).equals("C1")
					o(iterC.next().value.nodeName).equals("C2")
					o(iterC.next().done).deepEquals(true)

					// resolve C
					thenCBC()
					callAsync(function(){
						o(root.childNodes.length).equals(0)
						done()
					})
				})
			})
		})
	})
	o("works multiple vnodes with onbeforeremove (#3007, 4/6, ACB)", function (done) {
		let thenCBA, thenCBB, thenCBC
		const onbeforeremoveA = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBA = resolve}}
		})
		const onbeforeremoveB = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBB = resolve}}
		})
		const onbeforeremoveC = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBC = resolve}}
		})
		// to avoid updating internal nodes only, vnodes have key attributes
		const A = fragment({key: 1, onbeforeremove: onbeforeremoveA}, [m("a1"), m("a2")])
		const B = fragment({key: 2, onbeforeremove: onbeforeremoveB}, [m("b1"), m("b2")])
		const C = fragment({key: 3, onbeforeremove: onbeforeremoveC}, [m("c1"), m("c2")])

		render(root, [A])
		o(onbeforeremoveA.callCount).equals(0)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [B])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [C])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(1)

		// not resolved
		o(root.childNodes.length).equals(6)
		o(root.childNodes[0].nodeName).equals("A1")
		o(root.childNodes[1].nodeName).equals("A2")
		o(root.childNodes[2].nodeName).equals("B1")
		o(root.childNodes[3].nodeName).equals("B2")
		o(root.childNodes[4].nodeName).equals("C1")
		o(root.childNodes[5].nodeName).equals("C2")

		const iterA = domFor(A)
		o(iterA.next().value.nodeName).equals("A1")
		o(iterA.next().value.nodeName).equals("A2")
		o(iterA.next().done).deepEquals(true)

		const iterB = domFor(B)
		o(iterB.next().value.nodeName).equals("B1")
		o(iterB.next().value.nodeName).equals("B2")
		o(iterB.next().done).deepEquals(true)

		const iterC = domFor(C)
		o(iterC.next().value.nodeName).equals("C1")
		o(iterC.next().value.nodeName).equals("C2")
		o(iterC.next().done).deepEquals(true)

		callAsync(function(){
			// not resolved yet
			o(root.childNodes.length).equals(6)
			o(root.childNodes[0].nodeName).equals("A1")
			o(root.childNodes[1].nodeName).equals("A2")
			o(root.childNodes[2].nodeName).equals("B1")
			o(root.childNodes[3].nodeName).equals("B2")
			o(root.childNodes[4].nodeName).equals("C1")
			o(root.childNodes[5].nodeName).equals("C2")
	
			const iterA = domFor(A)
			o(iterA.next().value.nodeName).equals("A1")
			o(iterA.next().value.nodeName).equals("A2")
			o(iterA.next().done).deepEquals(true)
	
			const iterB = domFor(B)
			o(iterB.next().value.nodeName).equals("B1")
			o(iterB.next().value.nodeName).equals("B2")
			o(iterB.next().done).deepEquals(true)
	
			const iterC = domFor(C)
			o(iterC.next().value.nodeName).equals("C1")
			o(iterC.next().value.nodeName).equals("C2")
			o(iterC.next().done).deepEquals(true)

			// resolve A
			thenCBA()
			callAsync(function(){
				o(root.childNodes.length).equals(4)
				o(root.childNodes[0].nodeName).equals("B1")
				o(root.childNodes[1].nodeName).equals("B2")
				o(root.childNodes[2].nodeName).equals("C1")
				o(root.childNodes[3].nodeName).equals("C2")

				const iterB = domFor(B)
				o(iterB.next().value.nodeName).equals("B1")
				o(iterB.next().value.nodeName).equals("B2")
				o(iterB.next().done).deepEquals(true)

				const iterC = domFor(C)
				o(iterC.next().value.nodeName).equals("C1")
				o(iterC.next().value.nodeName).equals("C2")
				o(iterC.next().done).deepEquals(true)

				// resolve C
				thenCBC()
				callAsync(function(){
					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("B1")
					o(root.childNodes[1].nodeName).equals("B2")
					
					const iterC = domFor(B)
					o(iterC.next().value.nodeName).equals("B1")
					o(iterC.next().value.nodeName).equals("B2")
					o(iterC.next().done).deepEquals(true)

					// resolve B
					thenCBB()
					callAsync(function(){
						o(root.childNodes.length).equals(0)
						done()
					})
				})
			})
		})
	})
	o("works multiple vnodes with onbeforeremove (#3007, 5/6, BAC)", function (done) {
		let thenCBA, thenCBB, thenCBC
		const onbeforeremoveA = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBA = resolve}}
		})
		const onbeforeremoveB = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBB = resolve}}
		})
		const onbeforeremoveC = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBC = resolve}}
		})
		// to avoid updating internal nodes only, vnodes have key attributes
		const A = fragment({key: 1, onbeforeremove: onbeforeremoveA}, [m("a1"), m("a2")])
		const B = fragment({key: 2, onbeforeremove: onbeforeremoveB}, [m("b1"), m("b2")])
		const C = fragment({key: 3, onbeforeremove: onbeforeremoveC}, [m("c1"), m("c2")])

		render(root, [A])
		o(onbeforeremoveA.callCount).equals(0)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [B])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [C])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(1)

		// not resolved
		o(root.childNodes.length).equals(6)
		o(root.childNodes[0].nodeName).equals("A1")
		o(root.childNodes[1].nodeName).equals("A2")
		o(root.childNodes[2].nodeName).equals("B1")
		o(root.childNodes[3].nodeName).equals("B2")
		o(root.childNodes[4].nodeName).equals("C1")
		o(root.childNodes[5].nodeName).equals("C2")

		const iterA = domFor(A)
		o(iterA.next().value.nodeName).equals("A1")
		o(iterA.next().value.nodeName).equals("A2")
		o(iterA.next().done).deepEquals(true)

		const iterB = domFor(B)
		o(iterB.next().value.nodeName).equals("B1")
		o(iterB.next().value.nodeName).equals("B2")
		o(iterB.next().done).deepEquals(true)

		const iterC = domFor(C)
		o(iterC.next().value.nodeName).equals("C1")
		o(iterC.next().value.nodeName).equals("C2")
		o(iterC.next().done).deepEquals(true)

		callAsync(function(){
			// not resolved yet
			o(root.childNodes.length).equals(6)
			o(root.childNodes[0].nodeName).equals("A1")
			o(root.childNodes[1].nodeName).equals("A2")
			o(root.childNodes[2].nodeName).equals("B1")
			o(root.childNodes[3].nodeName).equals("B2")
			o(root.childNodes[4].nodeName).equals("C1")
			o(root.childNodes[5].nodeName).equals("C2")
	
			const iterA = domFor(A)
			o(iterA.next().value.nodeName).equals("A1")
			o(iterA.next().value.nodeName).equals("A2")
			o(iterA.next().done).deepEquals(true)
	
			const iterB = domFor(B)
			o(iterB.next().value.nodeName).equals("B1")
			o(iterB.next().value.nodeName).equals("B2")
			o(iterB.next().done).deepEquals(true)
	
			const iterC = domFor(C)
			o(iterC.next().value.nodeName).equals("C1")
			o(iterC.next().value.nodeName).equals("C2")
			o(iterC.next().done).deepEquals(true)

			// resolve B
			thenCBB()
			callAsync(function(){
				o(root.childNodes.length).equals(4)
				o(root.childNodes[0].nodeName).equals("A1")
				o(root.childNodes[1].nodeName).equals("A2")
				o(root.childNodes[2].nodeName).equals("C1")
				o(root.childNodes[3].nodeName).equals("C2")

				const iterB = domFor(A)
				o(iterB.next().value.nodeName).equals("A1")
				o(iterB.next().value.nodeName).equals("A2")
				o(iterB.next().done).deepEquals(true)

				const iterC = domFor(C)
				o(iterC.next().value.nodeName).equals("C1")
				o(iterC.next().value.nodeName).equals("C2")
				o(iterC.next().done).deepEquals(true)

				// resolve A
				thenCBA()
				callAsync(function(){
					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("C1")
					o(root.childNodes[1].nodeName).equals("C2")
					
					const iterC = domFor(C)
					o(iterC.next().value.nodeName).equals("C1")
					o(iterC.next().value.nodeName).equals("C2")
					o(iterC.next().done).deepEquals(true)

					// resolve C
					thenCBC()
					callAsync(function(){
						o(root.childNodes.length).equals(0)
						done()
					})
				})
			})
		})
	})
	o("works multiple vnodes with onbeforeremove (#3007, 6/6, CBA)", function (done) {
		let thenCBA, thenCBB, thenCBC
		const onbeforeremoveA = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBA = resolve}}
		})
		const onbeforeremoveB = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBB = resolve}}
		})
		const onbeforeremoveC = o.spy(function onbeforeremove(){
			return {then(resolve){thenCBC = resolve}}
		})
		// to avoid updating internal nodes only, vnodes have key attributes
		const A = fragment({key: 1, onbeforeremove: onbeforeremoveA}, [m("a1"), m("a2")])
		const B = fragment({key: 2, onbeforeremove: onbeforeremoveB}, [m("b1"), m("b2")])
		const C = fragment({key: 3, onbeforeremove: onbeforeremoveC}, [m("c1"), m("c2")])

		render(root, [A])
		o(onbeforeremoveA.callCount).equals(0)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [B])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(0)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [C])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(0)

		render(root, [])
		o(onbeforeremoveA.callCount).equals(1)
		o(onbeforeremoveB.callCount).equals(1)
		o(onbeforeremoveC.callCount).equals(1)

		// not resolved
		o(root.childNodes.length).equals(6)
		o(root.childNodes[0].nodeName).equals("A1")
		o(root.childNodes[1].nodeName).equals("A2")
		o(root.childNodes[2].nodeName).equals("B1")
		o(root.childNodes[3].nodeName).equals("B2")
		o(root.childNodes[4].nodeName).equals("C1")
		o(root.childNodes[5].nodeName).equals("C2")

		const iterA = domFor(A)
		o(iterA.next().value.nodeName).equals("A1")
		o(iterA.next().value.nodeName).equals("A2")
		o(iterA.next().done).deepEquals(true)

		const iterB = domFor(B)
		o(iterB.next().value.nodeName).equals("B1")
		o(iterB.next().value.nodeName).equals("B2")
		o(iterB.next().done).deepEquals(true)

		const iterC = domFor(C)
		o(iterC.next().value.nodeName).equals("C1")
		o(iterC.next().value.nodeName).equals("C2")
		o(iterC.next().done).deepEquals(true)

		callAsync(function(){
			// not resolved yet
			o(root.childNodes.length).equals(6)
			o(root.childNodes[0].nodeName).equals("A1")
			o(root.childNodes[1].nodeName).equals("A2")
			o(root.childNodes[2].nodeName).equals("B1")
			o(root.childNodes[3].nodeName).equals("B2")
			o(root.childNodes[4].nodeName).equals("C1")
			o(root.childNodes[5].nodeName).equals("C2")
	
			const iterA = domFor(A)
			o(iterA.next().value.nodeName).equals("A1")
			o(iterA.next().value.nodeName).equals("A2")
			o(iterA.next().done).deepEquals(true)
	
			const iterB = domFor(B)
			o(iterB.next().value.nodeName).equals("B1")
			o(iterB.next().value.nodeName).equals("B2")
			o(iterB.next().done).deepEquals(true)
	
			const iterC = domFor(C)
			o(iterC.next().value.nodeName).equals("C1")
			o(iterC.next().value.nodeName).equals("C2")
			o(iterC.next().done).deepEquals(true)

			// resolve C
			thenCBC()
			callAsync(function(){
				o(root.childNodes.length).equals(4)
				o(root.childNodes[0].nodeName).equals("A1")
				o(root.childNodes[1].nodeName).equals("A2")
				o(root.childNodes[2].nodeName).equals("B1")
				o(root.childNodes[3].nodeName).equals("B2")

				const iterB = domFor(A)
				o(iterB.next().value.nodeName).equals("A1")
				o(iterB.next().value.nodeName).equals("A2")
				o(iterB.next().done).deepEquals(true)

				const iterC = domFor(B)
				o(iterC.next().value.nodeName).equals("B1")
				o(iterC.next().value.nodeName).equals("B2")
				o(iterC.next().done).deepEquals(true)

				// resolve B
				thenCBB()
				callAsync(function(){
					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("A1")
					o(root.childNodes[1].nodeName).equals("A2")
					
					const iterC = domFor(A)
					o(iterC.next().value.nodeName).equals("A1")
					o(iterC.next().value.nodeName).equals("A2")
					o(iterC.next().done).deepEquals(true)

					// resolve A
					thenCBA()
					callAsync(function(){
						o(root.childNodes.length).equals(0)
						done()
					})
				})
			})
		})
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
			o("works in state.onbeforeremove and attrs.onbeforeremove", function () {
				const onbeforeremove = o.spy(function onbeforeremove(vnode){
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
					return {then(){}, finally(){}}
				})
				const C = createComponent({
					view({children}){return children},
					onbeforeremove
				})
				render(root, m(C, {onbeforeremove}, [
					m("a"),
					m("b"),
					m("c")
				]))
				render(root, [])

				o(onbeforeremove.callCount).equals(2)
			})
		})
	})
})