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
			expect(root.childNodes[2].tagName).to.equal("I")
		})

		it("works with mixed trusted content in text nodes", function () {
			var root = document.createElement("div")
			m.render(root, [
				m.trust("<p>1</p>123<p>2</p>"),
				m("i", "foo")
			])
			expect(root.childNodes[3].tagName).to.equal("I")
		})

		// TODO: m.trust's contents are having their tags stripped.
		xit("works with mixed trusted content in td", function () {
			var root = document.createElement("table")
			root.appendChild(root = document.createElement("tr"))

			m.render(root, [
				m.trust("<td>1</td><td>2</td>"),
				m("td", "foo")
			])

			expect(root.childNodes[2].tagName).to.equal("TD")
		})

		it("works with trusted content in div", function () {
			var root = document.createElement("div")
			m.render(root, m("div", [
				m("p", "&copy;"),
				m("p", m.trust("&copy;")),
				m.trust("&copy;")
			]))

			expect(root.innerHTML)
				.to.equal("<div><p>&amp;copy;</p><p>©</p>©</div>")
		})

		// https://github.com/lhorie/mithril.js/issues/1045
		it("correctly injects script tags and executes them", function () {
			var HTMLString =
			"<script>document.getElementById('root').innerText='After'</script>"
			var root = document.createElement("div")
			var child = document.createElement("div")
			root.id = "root"
			root.innerText = "Before"
			root.appendChild(child)
			document.body.appendChild(root)

			m.render(child, m.trust(HTMLString))

			expect(root.innerText).to.equal("After")
		})
	})
})
