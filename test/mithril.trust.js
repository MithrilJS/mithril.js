describe("m.trust()", function () {
	"use strict"

	it("exists", function () {
		expect(m.trust).to.be.a("function")
	})

	it("returns an instance of String", function () {
		expect(m.trust("foo")).to.be.an.instanceof(String)
	})

	it("does not modify the string", function () {
		expect(m.trust("foo").valueOf()).to.equal("foo")
	})

	it("is not identical to the string", function () {
		expect(m.trust("foo")).to.not.equal("foo")
	})

	// FIXME: implement document.createRange().createContextualFragment() in the
	// mock window for these tests
	dom(function () {
		it("isn't escaped in m.render()", function () {
			var root = document.createElement("div")
			m.render(root, m("div", "a", m.trust("&amp;"), "b"))
			expect(root.childNodes[0].innerHTML).to.equal("a&amp;b")
		})

		it("works with mixed trusted content in div", function () {
			var root = document.createElement("div")
			m.render(root, [m.trust("<p>1</p><p>2</p>"), m("i", "foo")])
			// Case-insensitive test to work around weird heisenbug with the
			// browser
			expect(root.childNodes[2].tagName).to.equalIgnoreCase("I")
		})

		it("works with mixed trusted content in text nodes", function () {
			var root = document.createElement("div")
			m.render(root, [
				m.trust("<p>1</p>123<p>2</p>"),
				m("i", "foo")
			])
			// Case-insensitive test to work around weird heisenbug with the
			// browser
			expect(root.childNodes[3].tagName).to.equalIgnoreCase("I")
		})

		// FIXME: this is a bug (trusted string's contents rendered as just
		// textual contents)
		it("works with mixed trusted content in td", function () {
			var root = document.createElement("table")
			root.appendChild(root = document.createElement("tr"))

			m.render(root, [
				m.trust("<td>1</td><td>2</td>"),
				m("td", "foo")
			])

			// Case-insensitive test to work around weird heisenbug with the
			// browser
			expect(root.childNodes[2].tagName).to.equalIgnoreCase("TD")
		})
	})
})
