describe("m.render()", function () {
	"use strict"

	it("exists", function () {
		expect(m.render).to.be.a("function")
	})

	it("renders a string", function () {
		var root = mock.document.createElement("div")
		m.render(root, "test")
		expect(root.childNodes[0].nodeValue).to.equal("test")
	})

	it("does not replace nodes differing in only class attr", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {class: "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {class: "b"}))
		expect(root.childNodes[0]).to.equal(elementBefore)
	})

	it("does not replace nodes differing in only class syntax", function () {
		var root = mock.document.createElement("div")
		m.render(root, m(".a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m(".b"))
		expect(root.childNodes[0]).to.equal(elementBefore)
	})

	it("replaces nodes differing in id attr", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {id: "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {title: "b"}))
		expect(root.childNodes[0]).to.not.equal(elementBefore)
	})

	it("replaces nodes differing in id syntax", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("[title=b]"))
		expect(root.childNodes[0]).to.not.equal(elementBefore)
	})

	it("replaces id node with string node", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, "test")
		expect(root.childNodes[0]).to.not.equal(elementBefore)
	})

	it("renders `undefined` body to empty string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [undefined]))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("")
	})

	it("renders `null` body to empty string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [null]))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("")
	})

	it("renders `true` body to empty string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [true]))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("")
	})

	it("renders `false` body to empty string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [false]))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("")
	})

	it("uses the W3C URI as default namespace for SVG children", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("svg", [m("g")]))
		expect(root.childNodes[0].childNodes[0]).to.contain.all.keys({
			nodeName: "G",
			namespaceURI: "http://www.w3.org/2000/svg"
		})
	})

	it("renders HTML elements contained in SVG elements", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("svg", [m("a[href='http://google.com']")]))
		expect(root.childNodes[0].childNodes[0].nodeName).to.equal("A")
	})

	it("does not append rerendered items", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div.classname", [m("a", {href: "/first"})]))
		m.render(root, m("div", [m("a", {href: "/second"})]))
		expect(root.childNodes[0].childNodes).to.have.length(1)
	})

	it("renders an added `undefined` to an empty string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		expect(root.childNodes[0].childNodes[1].nodeValue).to.equal("")
	})

	it("renders a node replaced with `undefined` to an empty string", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li"), m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		expect(root.childNodes[0].childNodes[1].nodeValue).to.equal("")
	})

	it("renders a replaced first `undefined` to an empty string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [undefined]))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("")
	})

	it("does not render something replaced with empty object", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [{}]))
		expect(root.childNodes[0].childNodes).to.be.empty
	})

	it("renders an incomplete tag with primitive tag type", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [{tag: "b", attrs: {}}]))
		expect(root.childNodes[0].childNodes[0].nodeName).to.equal("B")
	})

	it("renders an incomplete tag with String object tag type", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		/* eslint-disable no-new-wrappers */
		m.render(root, m("ul", [{tag: new String("b"), attrs: {}}]))
		/* eslint-enable no-new-wrappers */
		expect(root.childNodes[0].childNodes[0].nodeName).to.equal("B")
	})

	it("renders the last tag when `subtree: \"retain\"`", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", [m("a")])]))
		m.render(root, m("ul", [{subtree: "retain"}]))
		expect(root.childNodes[0].childNodes[0].childNodes[0].nodeName)
			.to.equal("A")
	})

	// https://github.com/lhorie/mithril.js/issues/43
	it("rerenders anchors correctly with mode abstraction (`config: m.route`)", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		m.render(root, m("a", {config: m.route}, "test"))
		m.render(root, m("a", {config: m.route}, "test"))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/45
	it("replaces initial null with string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/45
	it("replaces initial null with node", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		expect(root.childNodes[0].childNodes[0].nodeName).to.equal("DIV")
	})

	// https://github.com/lhorie/mithril.js/issues/45
	it("replaces initial string with node", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", ["test", m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		expect(root.childNodes[0].childNodes[0].nodeName).to.equal("DIV")
	})

	// https://github.com/lhorie/mithril.js/issues/45
	it("replaces initial node with string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/45
	it("adds new duplicate node", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("#bar")]))
		m.render(root, m("#foo", [m("#bar"), [m("#baz")]]))
		expect(root.childNodes[0].childNodes[1].id).to.equal("baz")
	})

	// https://github.com/lhorie/mithril.js/issues/48
	it("renders from html when base is document", function () {
		var root = mock.document
		m.render(root, m("html", [m("#foo")]))
		var result = root.childNodes[0].childNodes[0].id
		// Have to clean up before assertion, or this will break other tests
		root.childNodes = [mock.document.createElement("html")]
		expect(result).to.equal("foo")
	})

	// https://github.com/lhorie/mithril.js/issues/49
	it("reattaches cached text nodes to original parent (1)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("a", "test"))
		m.render(root, m("a.foo", "test"))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/49
	it("reattaches cached text nodes to original parent (2)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("a.foo", "test"))
		m.render(root, m("a", "test"))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/49
	it("reattaches cached text nodes to original parent (3)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("a.foo", "test"))
		m.render(root, m("a", "test1"))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("test1")
	})

	// https://github.com/lhorie/mithril.js/issues/49
	it("reattaches cached text nodes to original parent (4)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("a", "test"))
		m.render(root, m("a", "test1"))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("test1")
	})

	// https://github.com/lhorie/mithril.js/issues/50
	it("renders nested arrays correctly (1)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], m("#bar")]))

		expect(root.childNodes[0].childNodes[1].childNodes[0].nodeValue)
			.to.equal("b")
	})

	// https://github.com/lhorie/mithril.js/issues/50
	it("renders nested arrays correctly (2)", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("#foo", [
			[m("div", "a"), m("div", "b")],
			[m("div", "c"), m("div", "d")],
			m("#bar")
		]))

		expect(root.childNodes[0].childNodes[3].childNodes[0].nodeValue)
			.to.equal("d")
		expect(root.childNodes[0].childNodes[4].id).to.equal("bar")
	})

	// https://github.com/lhorie/mithril.js/issues/50
	it("renders nested arrays correctly (3)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], "test"]))
		expect(root.childNodes[0].childNodes[1].childNodes[0].nodeValue)
			.to.equal("b")
		expect(root.childNodes[0].childNodes[2].nodeValue).to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/50
	it("renders nested arrays correctly (4)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [["a", "b"], "test"]))
		expect(root.childNodes[0].childNodes[1].nodeValue).to.equal("b")
		expect(root.childNodes[0].childNodes[2].nodeValue).to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/156
	it("renders nested arrays correctly (5)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [
			["a", "b", "c", "d"].map(function () {
				return [m("div"), " "]
			}),
			m("span")
		]))
		expect(root.childNodes[0].childNodes[8].nodeName).to.equal("SPAN")
	})

	// https://github.com/lhorie/mithril.js/issues/50
	it("reconciles nested list differences correctly", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], m("#bar")]))

		m.render(root, m("#foo", [
			[m("div", "a"), m("div", "b"), m("div", "c")],
			m("#bar")
		]))

		expect(root.childNodes[0].childNodes[2].childNodes[0].nodeValue)
			.to.equal("c")
	})

	// https://github.com/lhorie/mithril.js/issues/51
	it("reconciles nested node differences correctly (1)", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("main", [
			m("button"),
			m("article", [m("section"), m("nav")])
		]))

		m.render(root, m("main", [
			m("button"),
			m("article", [m("span"), m("nav")])
		]))

		expect(root.childNodes[0].childNodes[1].childNodes[0].nodeName)
			.to.equal("SPAN")
	})

	// https://github.com/lhorie/mithril.js/issues/51
	it("reconciles nested node differences correctly (2)", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("main", [
			m("button"),
			m("article", [m("section"), m("nav")])
		]))

		m.render(root, m("main", [
			m("button"),
			m("article", ["test", m("nav")])
		]))

		expect(root.childNodes[0].childNodes[1].childNodes[0].nodeValue)
			.to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/51
	it("reconciles nested node differences correctly (3)", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("main", [
			m("button"),
			m("article", [m("section"), m("nav")])
		]))

		m.render(root, m("main", [
			m("button"),
			m("article", [m.trust("test"), m("nav")])
		]))

		expect(root.childNodes[0].childNodes[1].childNodes[0].nodeValue)
			.to.equal("test")
	})

	// https://github.com/lhorie/mithril.js/issues/55
	it("redraws when id attrs are different", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("#b"))
		expect(root.childNodes[0]).to.not.equal(elementBefore)
	})

	// https://github.com/lhorie/mithril.js/issues/56
	it("doesn't duplicate with a preceding null element", function () {
		var root = mock.document.createElement("div")
		m.render(root, [null, "foo"])
		m.render(root, ["bar"])
		expect(root.childNodes).to.have.length(1)
	})

	// https://github.com/lhorie/mithril.js/issues/56
	it("doesn't duplicate with a preceding element with same tag name", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		m.render(root, m("div", "foo"))
		expect(root.childNodes).to.have.length(1)
	})

	it("removes single `undefined` child node in place", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("button"), m("ul")]))
		expect(root.childNodes[0].childNodes[0])
			.to.have.property("nodeName", "BUTTON")
		m.render(root, m("div", [undefined, m("ul")]))
		expect(root.childNodes[0].childNodes[0])
			.to.have.property("nodeValue", "")
	})

	it("removes multiple `undefined` nodes in place", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("ul"), undefined]))

		expect(root.childNodes[0].childNodes[0])
			.to.have.property("nodeName", "UL")

		expect(root.childNodes[0].childNodes[1])
			.to.have.property("nodeValue", "")

		m.render(root, m("div", [undefined, m("ul")]))

		expect(root.childNodes[0].childNodes[0])
			.to.have.property("nodeValue", "")

		expect(root.childNodes[0].childNodes[1])
			.to.have.property("nodeName", "UL")
	})

	// https://github.com/lhorie/mithril.js/issues/79
	it("changes the style when specified in the node", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {style: {background: "red"}}))
		expect(root.childNodes[0].style).to.have.property("background", "red")
		m.render(root, m("div", {style: {}}))
		expect(root.childNodes[0].style).to.have.property("background", "")
	})

	it("reads styles from syntax", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div[style='background:red']"))
		expect(root.childNodes[0].style).to.equal("background:red")
	})

	it("removes styles when not passed", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {style: {background: "red"}}))
		expect(root.childNodes[0].style.background).to.equal("red")
		m.render(root, m("div", {}))
		expect(root.childNodes[0].style.background).to.not.exist
	})

	// https://github.com/lhorie/mithril.js/issues/87
	it("removes correct number of elements from nested lists (1)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [[m("a"), m("a")], m("button")]))
		m.render(root, m("div", [[m("a")], m("button")]))

		expect(root.childNodes[0].childNodes).to.have.length(2)

		expect(root.childNodes[0].childNodes[1])
			.to.have.property("nodeName", "BUTTON")
	})

	// https://github.com/lhorie/mithril.js/issues/87
	it("removes correct number of elements from nested lists (2)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("a"), m("b"), m("button")]))
		m.render(root, m("div", [m("a"), m("button")]))

		expect(root.childNodes[0].childNodes).to.have.length(2)

		expect(root.childNodes[0].childNodes[1])
			.to.have.property("nodeName", "BUTTON")
	})

	// https://github.com/lhorie/mithril.js/issues/99
	it("removes correct number of elements from nested lists (3)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("img"), m("h1")]))
		m.render(root, m("div", [m("a")]))

		expect(root.childNodes[0].childNodes).to.have.length(1)

		expect(root.childNodes[0].childNodes[0])
			.to.have.property("nodeName", "A")
	})

	// https://github.com/lhorie/mithril.js/issues/120
	it("avoids duplication in nested arrays (1)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", "b", "c", "d"]))
		m.render(root, m("div", [["d", "e"]]))

		var children = root.childNodes[0].childNodes

		expect(children).to.have.length(2)
		expect(children[0]).to.have.property("nodeValue", "d")
		expect(children[1]).to.have.property("nodeValue", "e")
	})

	// https://github.com/lhorie/mithril.js/issues/120
	it("avoids duplication in nested arrays (2)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [["a", "b", "c", "d"]]))
		m.render(root, m("div", ["d", "e"]))

		var children = root.childNodes[0].childNodes

		expect(children).to.have.length(2)
		expect(children[0]).to.have.property("nodeValue", "d")
		expect(children[1]).to.have.property("nodeValue", "e")
	})

	// https://github.com/lhorie/mithril.js/issues/120
	it("avoids duplication in nested arrays (3)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["x", [["a"], "b", "c", "d"]]))
		m.render(root, m("div", ["d", ["e"]]))

		var children = root.childNodes[0].childNodes

		expect(children).to.have.length(2)
		expect(children[0]).to.have.property("nodeValue", "d")
		expect(children[1]).to.have.property("nodeValue", "e")
	})

	// https://github.com/lhorie/mithril.js/issues/120
	it("avoids duplication in nested arrays (4)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["b"]))
		m.render(root, m("div", [["e"]]))

		var children = root.childNodes[0].childNodes

		expect(children).to.have.length(1)
		expect(children[0]).to.have.property("nodeValue", "e")
	})

	// https://github.com/lhorie/mithril.js/issues/120
	it("avoids duplication in nested arrays (5)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", ["b"]]))
		m.render(root, m("div", ["d", [["e"]]]))

		var children = root.childNodes[0].childNodes

		expect(children).to.have.length(2)
		expect(children[0]).to.have.property("nodeValue", "d")
		expect(children[1]).to.have.property("nodeValue", "e")
	})

	// https://github.com/lhorie/mithril.js/issues/120
	it("avoids duplication in nested arrays (6)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", [["b"]]]))
		m.render(root, m("div", ["d", ["e"]]))

		var children = root.childNodes[0].childNodes

		expect(children).to.have.length(2)
		expect(children[0]).to.have.property("nodeValue", "d")
		expect(children[1]).to.have.property("nodeValue", "e")
	})

	// https://github.com/lhorie/mithril.js/issues/120
	it("avoids duplication in nested arrays (7)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", [["b"], "c"]]))
		m.render(root, m("div", ["d", [[["e"]], "x"]]))

		var children = root.childNodes[0].childNodes

		expect(children).to.have.length(3)
		expect(children[0]).to.have.property("nodeValue", "d")
		expect(children[1]).to.have.property("nodeValue", "e")
	})

	it("honors setting context properties in stateful config", function () {
		var root = mock.document.createElement("div")
		var config = sinon.spy()

		m.render(root, m("div", {
			config: function (el, init, ctx) { ctx.data = 1 }
		}))

		m.render(root, m("div", {config: config}))

		expect(config.firstCall.args[2]).to.have.property("data", 1)
	})

	it("calls configs in order, first to last", function () {
		var root = mock.document.createElement("div")
		var config = sinon.spy()
		var index = 0

		var node = m("div", {
			config: function (el, init, ctx) { ctx.data = index++ }
		})

		m.render(root, [node, node])

		node = m("div", {config: config})
		m.render(root, [node, node])

		expect(config).to.have.been.called
		config.args.forEach(function (args, i) {
			expect(args[2]).to.have.property("data", i)
		})
	})

	it("passes the correct node as the element", function () {
		var root = mock.document.createElement("div")
		var spy = sinon.spy()
		m.render(root, m("div", m("a", {config: spy})))
		expect(spy).to.have.been.calledWith(root.childNodes[0].childNodes[0])
	})

	it("does not recursively call the config if a separate node is rendered to", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		var spy = sinon.spy(function () {
			var island = mock.document.createElement("div")
			m.render(island, m("div"))
		})

		m.render(root, m("div", m("a", {config: spy})))

		expect(spy).to.be.calledOnce
	})

	// https://github.com/lhorie/mithril.js/issues/129
	it("does not throw replacing arrays with single entries", function () {
		var root = mock.document.createElement("div")
		expect(function () {
			m.render(root, m("div", [
				["foo", "bar"],
				["foo", "bar"],
				["foo", "bar"]
			]))

			m.render(root, m("div", ["asdf", "asdf2", "asdf3"]))
		}).to.not.throw()
	})

	// https://github.com/lhorie/mithril.js/issues/98
	it("correctly keeps key association to nodes (1)", function () {
		// insert at beginning
		var root = mock.document.createElement("div")

		m.render(root, [
			m("a", {key: 1}, 1),
			m("a", {key: 2}, 2),
			m("a", {key: 3}, 3)
		])

		var firstBefore = root.childNodes[0]

		m.render(root, [
			m("a", {key: 4}, 4),
			m("a", {key: 1}, 1),
			m("a", {key: 2}, 2),
			m("a", {key: 3}, 3)
		])

		var firstAfter = root.childNodes[1]

		expect(firstBefore).to.equal(firstAfter)

		expect(root.childNodes[0].childNodes[0])
			.to.have.property("nodeValue", "4")

		expect(root.childNodes).to.have.length(4)
	})

	// https://github.com/lhorie/mithril.js/issues/98
	it("correctly keeps key association to nodes (2)", function () {
		var root = mock.document.createElement("div")

		m.render(root, [
			m("a", {key: 1}, 1),
			m("a", {key: 2}, 2),
			m("a", {key: 3}, 3)
		])

		var firstBefore = root.childNodes[0]

		m.render(root, [
			m("a", {key: 4}, 4),
			m("a", {key: 1}, 1),
			m("a", {key: 2}, 2)
		])

		var firstAfter = root.childNodes[1]

		expect(firstBefore).to.equal(firstAfter)

		expect(root.childNodes[0].childNodes[0])
			.to.have.property("nodeValue", "4")

		expect(root.childNodes).to.have.length(3)
	})

	// https://github.com/lhorie/mithril.js/issues/98
	it("correctly keeps key association to nodes (3)", function () {
		var root = mock.document.createElement("div")

		m.render(root, [
			m("a", {key: 1}, 1),
			m("a", {key: 2}, 2),
			m("a", {key: 3}, 3)
		])

		var firstBefore = root.childNodes[1]

		m.render(root, [
			m("a", {key: 2}, 2),
			m("a", {key: 3}, 3),
			m("a", {key: 4}, 4)
		])

		var firstAfter = root.childNodes[0]

		expect(firstBefore).to.equal(firstAfter)

		expect(root.childNodes[0].childNodes[0])
			.to.have.property("nodeValue", "2")

		expect(root.childNodes).to.have.length(3)
	})

	// https://github.com/lhorie/mithril.js/issues/98
	it("correctly keeps key association to nodes (4)", function () {
		var root = mock.document.createElement("div")

		m.render(root, [
			m("a", {key: 1}, 1),
			m("a", {key: 2}, 2),
			m("a", {key: 3}, 3),
			m("a", {key: 4}, 4),
			m("a", {key: 5}, 5)
		])

		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var fourthBefore = root.childNodes[3]

		m.render(root, [
			m("a", {key: 4}, 4),
			m("a", {key: 10}, 10),
			m("a", {key: 1}, 1),
			m("a", {key: 2}, 2)
		])

		var firstAfter = root.childNodes[2]
		var secondAfter = root.childNodes[3]
		var fourthAfter = root.childNodes[0]

		expect(firstBefore).to.equal(firstAfter)
		expect(secondBefore).to.equal(secondAfter)
		expect(fourthBefore).to.equal(fourthAfter)
		expect(root.childNodes[1].childNodes[0].nodeValue).to.equal("10")
		expect(root.childNodes).to.have.length(4)
	})

	// https://github.com/lhorie/mithril.js/issues/98
	it("correctly keeps key association to nodes (5)", function () {
		var root = mock.document.createElement("div")

		m.render(root, [
			m("a", {key: 1}, 1),
			m("a", {key: 2}, 2),
			m("a", {key: 3}, 3),
			m("a", {key: 4}, 4),
			m("a", {key: 5}, 5)
		])

		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var fourthBefore = root.childNodes[3]

		m.render(root, [
			m("a", {key: 4}, 4),
			m("a", {key: 10}, 10),
			m("a", {key: 2}, 2),
			m("a", {key: 1}, 1),
			m("a", {key: 6}, 6),
			m("a", {key: 7}, 7)
		])

		var firstAfter = root.childNodes[3]
		var secondAfter = root.childNodes[2]
		var fourthAfter = root.childNodes[0]

		expect(firstBefore).to.equal(firstAfter)
		expect(secondBefore).to.equal(secondAfter)
		expect(fourthBefore).to.equal(fourthAfter)

		expect(root.childNodes[1].childNodes[0].nodeValue).to.equal("10")
		expect(root.childNodes[4].childNodes[0].nodeValue).to.equal("6")
		expect(root.childNodes[5].childNodes[0].nodeValue).to.equal("7")

		expect(root.childNodes).to.have.length(6)
	})

	// https://github.com/lhorie/mithril.js/issues/149
	it("correctly keeps key association to nodes (6)", function () {
		var root = mock.document.createElement("div")

		m.render(root, [
			m("a", {key: 1}),
			m("a", {key: 2}),
			m("a"),
			m("a", {key: 4}),
			m("a", {key: 5})
		])

		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var thirdBefore = root.childNodes[2]
		var fourthBefore = root.childNodes[3]
		var fifthBefore = root.childNodes[4]

		m.render(root, [
			m("a", {key: 4}),
			m("a", {key: 5}),
			m("a"),
			m("a", {key: 1}),
			m("a", {key: 2})
		])

		var firstAfter = root.childNodes[3]
		var secondAfter = root.childNodes[4]
		var thirdAfter = root.childNodes[2]
		var fourthAfter = root.childNodes[0]
		var fifthAfter = root.childNodes[1]

		expect(firstBefore).to.equal(firstAfter)
		expect(secondBefore).to.equal(secondAfter)
		expect(thirdBefore).to.equal(thirdAfter)
		expect(fourthBefore).to.equal(fourthAfter)
		expect(fifthBefore).to.equal(fifthAfter)
	})

	// https://github.com/lhorie/mithril.js/issues/246
	it("correctly renders non-keyed objects in the middle", function () {
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}, 1)])
		var firstBefore = root.childNodes[0]
		m.render(root, [m("a", {key: 2}, 2), m("br"), m("a", {key: 1}, 1)])
		var firstAfter = root.childNodes[2]
		expect(firstBefore).to.equal(firstAfter)
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("2")
		expect(root.childNodes.length).to.equal(3)
	})

	// https://github.com/lhorie/mithril.js/issues/134
	it("doesn't redraw when updating contenteditable", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {contenteditable: true}, "test"))
		mock.document.activeElement = root.childNodes[0]
		m.render(root, m("div", {contenteditable: true}, "test1"))
		m.render(root, m("div", {contenteditable: false}, "test2"))
		expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("test2")
	})

	// https://github.com/lhorie/mithril.js/issues/136
	it("redraws when a textarea updates its values", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("textarea", ["test"]))
		m.render(root, m("textarea", ["test1"]))
		expect(root.childNodes[0].value).to.equal("test1")
	})

	it("doesn't call onunload when matching keys are given", function () {
		var root = mock.document.createElement("div")
		var spy = sinon.spy()
		m.render(root, [
			m("div", {
				key: 1,
				config: function (el, init, ctx) {
					ctx.onunload = spy
				}
			})
		])
		m.render(root, [
			m("div", {key: 2}),
			m("div", {
				key: 1,
				config: function (el, init, ctx) {
					ctx.onunload = spy
				}
			})
		])
		expect(spy).to.not.have.been.called
	})

	it("unloads the parent but not child, when parent changes and not child", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		var parentSpy = sinon.spy()
		var childSpy = sinon.spy()

		function parent(el, init, ctx) {
			ctx.onunload = parentSpy
		}

		function child(el, init, ctx) {
			ctx.onunload = childSpy
		}

		m.render(root, m("div", {config: parent}, m("a", {config: child})))
		m.render(root, m("main", {config: parent}, m("a", {config: child})))

		expect(parentSpy).to.be.calledOnce
		expect(childSpy).to.not.have.been.called
	})

	it("unloads parent and child when both change", function () {
		var root = mock.document.createElement("div")
		var parentSpy = sinon.spy()
		var childSpy = sinon.spy()

		function parent(el, init, ctx) {
			ctx.onunload = parentSpy
		}

		function child(el, init, ctx) {
			ctx.onunload = childSpy
		}

		m.render(root, m("div", {config: parent}, m("a", {config: child})))
		m.render(root, m("main", {config: parent}, m("b", {config: child})))
		expect(parentSpy).to.have.been.calledOnce
		expect(childSpy).to.have.been.calledOnce
	})

	// https://github.com/lhorie/mithril.js/issues/150
	it("treats empty arrays similarly to `null` and `undefined`", function () {
		var root = mock.document.createElement("div")
		m.render(root, [m("a"), m("div")])
		m.render(root, [[], m("div")])
		expect(root.childNodes.length).to.equal(1)
		expect(root.childNodes[0].nodeName).to.equal("DIV")
	})

	// https://github.com/lhorie/mithril.js/issues/157
	it("renders nodes with new keys correctly", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [
			m("li", {key: 0}, 0),
			m("li", {key: 2}, 2),
			m("li", {key: 4}, 4)
		]))

		m.render(root, m("ul", [
			m("li", {key: 0}, 0),
			m("li", {key: 1}, 1),
			m("li", {key: 2}, 2),
			m("li", {key: 3}, 3),
			m("li", {key: 4}, 4),
			m("li", {key: 5}, 5)
		]))

		expect(
			root.childNodes[0].childNodes.map(function (n) {
				return n.childNodes[0].nodeValue
			})
		).to.eql(["0", "1", "2", "3", "4", "5"])
	})

	// https://github.com/lhorie/mithril.js/issues/157
	it("doesn't render extra child nodes if none are given (1)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("input", {value: "a"}))
		m.render(root, m("input", {value: "aa"}))
		expect(root.childNodes[0].childNodes).to.be.empty
	})

	// https://github.com/lhorie/mithril.js/issues/157
	it("doesn't render extra child nodes if none are given (2)", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("br", {class: "a"}))
		m.render(root, m("br", {class: "aa"}))
		expect(root.childNodes[0].childNodes).to.be.empty
	})

	// https://github.com/lhorie/mithril.js/issues/194
	it("removes removed contained keyed elements from DOM", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("ul", [
			m("li", {key: 0}, 0),
			m("li", {key: 1}, 1),
			m("li", {key: 2}, 2),
			m("li", {key: 3}, 3),
			m("li", {key: 4}, 4),
			m("li", {key: 5}, 5)
		]))

		m.render(root, m("ul", [
			m("li", {key: 0}, 0),
			m("li", {key: 1}, 1),
			m("li", {key: 2}, 2),
			m("li", {key: 4}, 4),
			m("li", {key: 5}, 5)
		]))

		expect(
			root.childNodes[0].childNodes.map(function (n) {
				return n.childNodes[0].nodeValue
			})
		).to.eql(["0", "1", "2", "4", "5"])
	})

	// https://github.com/lhorie/mithril.js/issues/194
	it("removes removed list of keyed elements from DOM", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("ul", [
			m("li", {key: 0}, 0),
			m("li", {key: 1}, 1),
			m("li", {key: 2}, 2),
			m("li", {key: 3}, 3),
			m("li", {key: 4}, 4),
			m("li", {key: 5}, 5)
		]))

		m.render(root, m("ul", [
			m("li", {key: 1}, 1),
			m("li", {key: 2}, 2),
			m("li", {key: 3}, 3),
			m("li", {key: 4}, 4),
			m("li", {key: 5}, 5),
			m("li", {key: 6}, 6)
		]))

		m.render(root, m("ul", [
			m("li", {key: 12}, 12),
			m("li", {key: 13}, 13),
			m("li", {key: 14}, 14),
			m("li", {key: 15}, 15),
			m("li", {key: 16}, 16),
			m("li", {key: 17}, 17)
		]))

		expect(
			root.childNodes[0].childNodes.map(function (n) {
				return n.childNodes[0].nodeValue
			})
		).to.eql(["12", "13", "14", "15", "16", "17"])
	})

	// https://github.com/lhorie/mithril.js/issues/206
	it("removes `undefined` children", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", undefined))
		m.render(root, m("div", [m("div")]))
		expect(root.childNodes[0].childNodes).to.have.length(1)
	})

	// https://github.com/lhorie/mithril.js/issues/206
	it("removes `null` children", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", null))
		m.render(root, m("div", [m("div")]))
		expect(root.childNodes[0].childNodes).to.have.length(1)
	})

	// https://github.com/lhorie/mithril.js/issues/200
	it("calls onunload when updating a rendered collection", function () {
		var root = mock.document.createElement("div")

		var onunload1 = sinon.spy()
		var onunload2 = sinon.spy()

		m.render(root, [m("div", {
			config: function (el, init, ctx) {
				ctx.onunload = onunload1
			}
		})])

		m.render(root, [])

		m.render(root, [m("div", {
			config: function (el, init, ctx) {
				ctx.onunload = onunload2
			}
		})])

		m.render(root, [])

		expect(onunload1).to.be.called
		expect(onunload2).to.be.called
	})

	it("should prepend new DOM elements", function () {
		var root = mock.document.createElement("div")

		m.render(root, [m("div.blue")])

		m.render(root, [
			m("div.green", [m("div")]),
			m("div.blue")
		])

		expect(root.childNodes).to.have.length(2)
	})

	// https://github.com/lhorie/mithril.js/issues/277
	it("adds objects that look like virtual nodes", function () {
		var root = mock.document.createElement("div")
		function Field() {
			this.tag = "div"
			this.attrs = {}
			this.children = "hello"
		}
		m.render(root, new Field())
		expect(root.childNodes).to.have.length(1)
	})

	it("doesn't add objects that don't look like virtual nodes", function () {
		var root = mock.document.createElement("div")
		m.render(root, {foo: 123})
		expect(root.childNodes).to.have.length(0)
	})

	// https://github.com/lhorie/mithril.js/issues/299
	it("retains key order in the presence of `null`s (1)", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("div", [
			m("div", {key: 1}, 1),
			m("div", {key: 2}, 2),
			m("div", {key: 3}, 3),
			m("div", {key: 4}, 4),
			m("div", {key: 5}, 5),
			null, null, null, null, null, null, null, null, null, null
		]))

		m.render(root, m("div", [
			null, null,
			m("div", {key: 3}, 3),
			null, null,
			m("div", {key: 6}, 6),
			null, null,
			m("div", {key: 9}, 9),
			null, null,
			m("div", {key: 12}, 12),
			null, null,
			m("div", {key: 15}, 15)
		]))

		m.render(root, m("div", [
			m("div", {key: 1}, 1),
			m("div", {key: 2}, 2),
			m("div", {key: 3}, 3),
			m("div", {key: 4}, 4),
			m("div", {key: 5}, 5),
			null, null, null, null, null, null, null, null, null, null
		]))

		expect(
			root.childNodes[0].childNodes.map(function (c) {
				return c.childNodes ? c.childNodes[0].nodeValue : c.nodeValue
			}).slice(0, 5)
		).to.eql(["1", "2", "3", "4", "5"])
	})

	// https://github.com/lhorie/mithril.js/issues/299
	// https://github.com/lhorie/mithril.js/issues/377
	it("retains key order in the presence of `null`s (2)", function () {
		var root = mock.document.createElement("div")

		m.render(root, m("div", [
			m("div", 1),
			m("div", 2),
			[
				m("div", {key: 3}, 3),
				m("div", {key: 4}, 4),
				m("div", {key: 5}, 5)
			],
			[m("div", {key: 6}, 6)]
		]))

		m.render(root, m("div", [
			m("div", 1),
			null,
			[
				m("div", {key: 3}, 3),
				m("div", {key: 4}, 4),
				m("div", {key: 5}, 5)
			],
			[m("div", {key: 6}, 6)]
		]))

		expect(
			root.childNodes[0].childNodes.map(function (c) {
				return c.childNodes ? c.childNodes[0].nodeValue : c.nodeValue
			})
		).to.eql(["1", "", "3", "4", "5", "6"])
	})

	it("doesn't throw trying to render result of console.log()", function () {
		var root = mock.document.createElement("div")
		expect(function () {
			/* eslint-disable no-console */
			m.render(root, m("div", [console.log()]))
			/* eslint-enable no-console */
		}).to.not.throw()
	})

	it("retains key order for ids", function () {
		var root = mock.document.createElement("div")

		m.render(root, [
			m("#div-1", {key: 1}),
			m("#div-2", {key: 2}),
			m("#div-3", {key: 3})
		])

		root.appendChild(root.childNodes[1])

		m.render(root, [
			m("#div-1", {key: 1}),
			m("#div-3", {key: 3}),
			m("#div-2", {key: 2})
		])

		expect(
			root.childNodes.map(function (node) { return node.id })
		).to.eql(["div-1", "div-3", "div-2"])
	})

	it("doesn't render functions as nodes", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", function () {}))
		expect(root.childNodes[0].childNodes).to.have.length(0)
	})

	it("removes nodes that result in only a single text node", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", "foo", m("a")))
		m.render(root, m("div", "test"))
		expect(root.childNodes[0].childNodes).to.have.length(1)
	})

	it("keeps identity if the element is preceded by conditional", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("a"), m("input[autofocus]")]))
		var before = root.childNodes[0].childNodes[1]
		m.render(root, m("div", [undefined, m("input[autofocus]")]))
		var after = root.childNodes[0].childNodes[1]
		expect(before).to.equal(after)
	})

	it("keeps unkeyed identity if mixed with keyed elements and identity can be inferred", function () { // eslint-disable-line
		var root = mock.document.createElement("div")

		m.render(root, m("div", [
			m("a", {key: 1}),
			m("a", {key: 2}),
			m("a", {key: 3}),
			m("i")
		]))
		var before = root.childNodes[0].childNodes[3]

		m.render(root, m("div", [
			m("b", {key: 3}),
			m("b", {key: 4}),
			m("i"),
			m("b", {key: 1})
		]))
		var after = root.childNodes[0].childNodes[2]

		expect(before).to.equal(after)
	})

	it("keeps unkeyed identity if mixed with keyed/text elements and identity can be inferred", function () { // eslint-disable-line
		var root = mock.document.createElement("div")

		m.render(root, m("div", [
			m("a", {key: 1}),
			m("a", {key: 2}),
			"foo",
			m("a", {key: 3}),
			m("i")
		]))
		var before = root.childNodes[0].childNodes[4]

		m.render(root, m("div", [
			m("a", {key: 3}),
			m("a", {key: 4}),
			"bar",
			m("i"),
			m("a", {key: 1})
		]))
		var after = root.childNodes[0].childNodes[3]

		expect(before).to.equal(after)
	})

	it("keeps unkeyed identity if mixed with elements/nulls and identity can be inferred", function () { // eslint-disable-line
		var root = mock.document.createElement("div")

		m.render(root, m("div", [
			m("a", {key: 1}),
			m("a", {key: 2}),
			null,
			m("a", {key: 3}),
			m("i")
		]))
		var before = root.childNodes[0].childNodes[4]

		m.render(root, m("div", [
			m("a", {key: 3}),
			m("a", {key: 4}),
			null,
			m("i"),
			m("a", {key: 1})
		]))
		var after = root.childNodes[0].childNodes[3]

		expect(before).to.equal(after)
	})

	it("keeps unkeyed identity if mixed with elements/undefined and identity can be inferred", function () { // eslint-disable-line
		var root = mock.document.createElement("div")

		m.render(root, m("div", [
			m("a", {key: 1}),
			m("a", {key: 2}),
			undefined,
			m("a", {key: 3}),
			m("i")
		]))
		var before = root.childNodes[0].childNodes[4]

		m.render(root, m("div", [
			m("a", {key: 3}),
			m("a", {key: 4}),
			undefined,
			m("i"),
			m("a", {key: 1})
		]))
		var after = root.childNodes[0].childNodes[3]

		expect(before).to.equal(after)
	})

	// FIXME: implement document.createRange().createContextualFragment() in the
	// mock document to fix this test
	it("keeps unkeyed identity if mixed with elements/trusted text and identity can be inferred", function () { // eslint-disable-line
		var root = mock.document.createElement("div")

		m.render(root, m("div", [
			m("a", {key: 1}),
			m("a", {key: 2}),
			m.trust("a"),
			m("a", {key: 3}),
			m("i")
		]))
		var before = root.childNodes[0].childNodes[4]

		m.render(root, m("div", [
			m("a", {key: 3}),
			m("a", {key: 4}),
			m.trust("a"),
			m("i"),
			m("a", {key: 1})
		]))
		var after = root.childNodes[0].childNodes[3]

		expect(before).to.equal(after)
	})

	it("uses the syntax class if it's given as `undefined` in attr", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		var vdom = m("div.a", {class: undefined})
		m.render(root, vdom)
		expect(root.childNodes[0].class).to.equal("a")
	})

	it("updates div with syntax class and removed body", function () {
		var root = mock.document.createElement("div")
		m.render(root, m(".a", [1]))
		m.render(root, m(".a", []))
		expect(root.childNodes[0].childNodes).to.have.length(0)
	})

	it("renders removed elements in div with empty attrs correctly", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		m.render(root, m("div", {}, [
			m("div", {}, "0"),
			m("div", {}, "1"),
			m("div", {}, "2")
		]))

		expect(
			root.childNodes[0].childNodes.map(function (node) {
				return node.childNodes[0].nodeValue
			})
		).to.eql(["0", "1", "2"])

		m.render(root, m("div", {}, [
			m("div", {}, "0")
		]))

		expect(
			root.childNodes[0].childNodes.map(function (node) {
				return node.childNodes[0].nodeValue
			})
		).to.eql(["0"])
	})

	it("renders removed elements in span with empty attrs correctly", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		m.render(root, m("span", {}, [
			m("div", {}, "0"),
			m("div", {}, "1"),
			m("div", {}, "2")
		]))

		expect(
			root.childNodes[0].childNodes.map(function (node) {
				return node.childNodes[0].nodeValue
			})
		).to.eql(["0", "1", "2"])

		m.render(root, m("span", {}, [
			m("div", {}, "0")
		]))

		expect(
			root.childNodes[0].childNodes.map(function (node) {
				return node.childNodes[0].nodeValue
			})
		).to.eql(["0"])
	})

	function emit(el, ev) {
		el[ev]({currentTarget: el})
	}

	// https://github.com/lhorie/mithril.js/issues/214
	it("keeps all input events", function () {
		var root = mock.document.createElement("div")

		var ctrl = m.mount(root, {
			controller: function () {
				this.inputValue = m.prop("")
			},
			view: function (ctrl) {
				return m("input", {
					value: ctrl.inputValue(),
					onkeyup: m.withAttr("value", ctrl.inputValue)
				})
			}
		})
		mock.requestAnimationFrame.$resolve()

		var input = mock.document.activeElement = root.childNodes[0]
		var expected = ""
		var keys = "0123456789abcdef"

		function writeKey(key) {
			input.value += key[0]
			emit(input, "onkeyup")
			mock.requestAnimationFrame.$resolve()
		}

		for (var i = 0; i < 4; i++) {
			expected += keys
			keys.split("").forEach(writeKey)
		}

		expect(ctrl.inputValue()).to.equal(expected)
		expect(input.value).to.equal(expected)

		mock.document.activeElement = null
	})

	// https://github.com/lhorie/mithril.js/issues/288
	it("doesn't reset if the input value is submitted with <enter>", function () { // eslint-disable-line
		var root = mock.document.createElement("div")

		var ctrl = m.mount(root, {
			controller: function () {
				this.inputValue = m.prop("")

				this.submit = function () {
					if (this.inputValue()) {
						this.inputValue("")
					}
				}.bind(this)
			},

			view: function (ctrl) {
				return m("form", {onsubmit: ctrl.submit}, [
					m("input", {
						onkeyup: m.withAttr("value", ctrl.inputValue),
						value: ctrl.inputValue()
					}),
					m("button[type=submit]")
				])
			}
		})

		var form = root.childNodes[0]
		var input = mock.document.activeElement = form.childNodes[0]

		function writeKey(key) {
			if (key === "[enter]") {
				emit(form, "onsubmit")
			} else {
				input.value += key[0]
				emit(input, "onkeyup")
			}
			mock.requestAnimationFrame.$resolve()
		}

		writeKey("a")
		writeKey("b")
		writeKey("c")
		writeKey("d")
		writeKey("[enter]")

		expect(ctrl.inputValue()).to.equal("")
		expect(input.value).to.equal("")

		mock.document.activeElement = null
	})

	// https://github.com/lhorie/mithril.js/issues/278
	it("renders multiple select correctly", function () {
		var root = mock.document.createElement("div")

		m.mount(root, {
			controller: function () {
				this.values = [1, 2, 3, 4, 5]
				this.value = m.prop([2, 3])
			},

			view: function (ctrl) {
				return m("select", {
					size: ctrl.values.length,
					multiple: "multiple"
				}, [
					ctrl.values.map(function (v) {
						var opts = {value: v}
						if (ctrl.value().indexOf(v) !== -1) {
							opts.selected = "selected"
						}
						return m("option", opts, v)
					})
				])
			}
		})

		mock.requestAnimationFrame.$resolve()

		var select = root.childNodes[0]

		expect(select.childNodes[0].selected).to.not.be.ok
		expect(select.childNodes[1].selected).to.be.ok
		expect(select.childNodes[2].selected).to.be.ok
		expect(select.childNodes[3].selected).to.not.be.ok
		expect(select.childNodes[4].selected).to.not.be.ok
	})

	it("doesn't treat 0 as an empty string", function () {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {class: ""}))
		m.render(root, m("div", {class: 0}))
		expect(root.childNodes[0].class).to.equal("0")
	})

	dom(function () {
		it("renders empty `value` in <option> as an existing attribute", function () { // eslint-disable-line
			var root = document.createElement("div")
			m.render(root, m("select", m("option", {value: ""}, "aaa")))
			expect(root.childNodes[0].innerHTML)
				.to.equal('<option value="">aaa</option>')
		})

		it("sets correct <select> value", function () {
			var root = document.createElement("div")
			m.render(root, m("select", {value: "b"}, [
				m("option", {value: "a"}, "aaa"),
				m("option", {value: "b"}, "bbb")
			]))
			// This works only if select value is set after its options exist.
			expect(root.childNodes[0].value).to.equal("b")
		})

		it("caches children of editable on update", function () {
			var root = document.createElement("span")
			var t1 = m.trust("<h1>fo</h1>o")
			var t2 = "foo"

			m.render(root, m("span", {contenteditable: false}, t1))
			m.render(root, m("span", {contenteditable: true}, t2))
			m.render(root, m("span", {contenteditable: false}, t1))

			expect(root.childNodes[0].innerHTML).to.equal(t1.valueOf())
		})

		it("editable node w/ focus is updated on data change", function () {
			var root = document.createElement('div')

			// need this in order for focus & activeElement to work properly
			document.body.appendChild(root)

			m.render(root, m('span', {
				config: function(el) { el.focus() },
				contenteditable: true
			}, 'a'))

			m.render(root, m('span', {
				config: function(el) { el.focus() },
				contenteditable: true
			}, 'b'))

			expect(root.childNodes[0].innerHTML).to.equal('b')
		})

	})
})
