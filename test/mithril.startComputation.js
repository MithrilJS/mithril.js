describe("m.startComputation(), m.endComputation()", function () {
	"use strict"

	it("exists", function () {
		expect(m.startComputation).to.be.a("function")
		expect(m.endComputation).to.be.a("function")
	})

	it("blocks automatic rendering", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var controller = m.mount(root, {
			controller: function () {},
			view: function (ctrl) { return ctrl.value }
		})

		mock.requestAnimationFrame.$resolve()

		m.startComputation()
		controller.value = "foo"
		m.endComputation()
		mock.requestAnimationFrame.$resolve()
		expect(root.childNodes[0].nodeValue).to.equal("foo")
	})

	// FIXME: this needs to be better tested
})
