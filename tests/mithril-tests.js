function testMithril(mock) {
	m.deps(mock)

	//m
	test(function() {return m("div").tag === "div"})
	test(function() {return m(".foo").tag === "div"})
	test(function() {return m(".foo").attrs.className === "foo"})
	test(function() {return m("[title=bar]").tag === "div"})
	test(function() {return m("[title=bar]").attrs.title === "bar"})
	test(function() {return m("[title=\'bar\']").attrs.title === "bar"})
	test(function() {return m("[title=\"bar\"]").attrs.title === "bar"})
	test(function() {return m("div", "test").children === "test"})
	test(function() {return m("div", ["test"]).children[0] === "test"})
	test(function() {return m("div", {title: "bar"}, "test").attrs.title === "bar"})
	test(function() {return m("div", {title: "bar"}, "test").children === "test"})
	test(function() {return m("div", {title: "bar"}, ["test"]).children[0] === "test"})
	test(function() {return m("div", {title: "bar"}, m("div")).children.tag === "div"})
	test(function() {return m("div", {title: "bar"}, [m("div")]).children[0].tag === "div"})
	test(function() {return m("div", ["a", "b"]).children.length === 2})
	test(function() {return m("div", [m("div")]).children[0].tag === "div"})
	test(function() {return m("div", m("div")).children.tag === "div"}) //yes, this is expected behavior: see method signature
	test(function() {return m("div", [undefined]).tag === "div"})
	test(function() {return m("div", [{foo: "bar"}])}) //as long as it doesn't throw errors, it's fine
	test(function() {return m("svg", [m("g")])})
	test(function() {return m("svg", [m("a[href='http://google.com']")])})
	test(function() {return m(".foo", {class: "bar"}).attrs.class == "foo bar"})
	test(function() {return m(".foo", {className: "bar"}).attrs.className == "foo bar"})

	//m.module
	test(function() {
		mock.requestAnimationFrame.$resolve()

		var root1 = mock.document.createElement("div")
		m.module(root1, {
			controller: function() {this.value = "test1"},
			view: function(ctrl) {return ctrl.value}
		})

		var root2 = mock.document.createElement("div")
		m.module(root2, {
			controller: function() {this.value = "test2"},
			view: function(ctrl) {return ctrl.value}
		})

		mock.requestAnimationFrame.$resolve()

		return root1.childNodes[0].nodeValue === "test1" && root2.childNodes[0].nodeValue === "test2"
	})

	//m.withAttr
	test(function() {
		var value
		var handler = m.withAttr("test", function(data) {value = data})
		handler({currentTarget: {test: "foo"}})
		return value === "foo"
	})

	//m.trust
	test(function() {return m.trust("test").valueOf() === "test"})

	//m.render
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, "test")
		return root.childNodes[0].nodeValue === "test"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {class: "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {class: "b"}))
		var elementAfter = root.childNodes[0]
		return elementBefore === elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m(".a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m(".b"))
		var elementAfter = root.childNodes[0]
		return elementBefore === elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {id: "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {title: "b"}))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("[title=b]"))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, "test")
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [undefined]))
		return root.childNodes[0].childNodes[0].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("svg", [m("g")]))
		var g = root.childNodes[0].childNodes[0]
		return g.nodeName === "G" && g.namespaceURI == "http://www.w3.org/2000/svg"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("svg", [m("a[href='http://google.com']")]))
		return root.childNodes[0].childNodes[0].nodeName === "A"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div.classname", [m("a", {href: "/first"})]))
		m.render(root, m("div", [m("a", {href: "/second"})]))
		return root.childNodes[0].childNodes.length == 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		return root.childNodes[0].childNodes[1].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li"), m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [undefined]))
		return root.childNodes[0].childNodes[0].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [{}]))
		return root.childNodes[0].childNodes.length === 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", [m("a")])]))
		m.render(root, m("ul", [{subtree: "retain"}]))
		return root.childNodes[0].childNodes[0].childNodes[0].nodeName === "A"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/43
		var root = mock.document.createElement("div")
		m.render(root, m("a", {config: m.route}, "test"))
		m.render(root, m("a", {config: m.route}, "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/29
		var root = mock.document.createElement("div")
		var list = [false, false]
		m.render(root, list.reverse().map(function(flag, index) {
			return m("input[type=checkbox]", {onclick: m.withAttr("checked", function(value) {list[index] = value}), checked: flag})
		}))

		mock.document.activeElement = root.childNodes[0]
		root.childNodes[0].checked = true
		root.childNodes[0].onclick({currentTarget: {checked: true}})

		m.render(root, list.reverse().map(function(flag, index) {
			return m("input[type=checkbox]", {onclick: m.withAttr("checked", function(value) {list[index] = value}), checked: flag})
		}))

		mock.document.activeElement = null

		return root.childNodes[0].checked === false && root.childNodes[1].checked === true
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (1)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (2)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeName === "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (3)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", ["test", m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeName === "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (4)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (5)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("#bar")]))
		m.render(root, m("#foo", [m("#bar"), [m("#baz")]]))
		return root.childNodes[0].childNodes[1].id === "baz"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/48
		var root = mock.document
		m.render(root, m("html", [m("#foo")]))
		var result = root.childNodes[0].childNodes[0].id === "foo"
		root.childNodes = [mock.document.createElement("html")]
		return result
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a", "test"))
		m.render(root, m("a.foo", "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a.foo", "test"))
		m.render(root, m("a", "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a.foo", "test"))
		m.render(root, m("a", "test1"))
		return root.childNodes[0].childNodes[0].nodeValue === "test1"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a", "test"))
		m.render(root, m("a", "test1"))
		return root.childNodes[0].childNodes[0].nodeValue === "test1"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], m("#bar")]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "b"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], m("#bar")]))
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b"), m("div", "c")], m("#bar")]))
		return root.childNodes[0].childNodes[2].childNodes[0].nodeValue === "c"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], [m("div", "c"), m("div", "d")], m("#bar")]))
		return root.childNodes[0].childNodes[3].childNodes[0].nodeValue === "d" && root.childNodes[0].childNodes[4].id === "bar"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], "test"]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "b" && root.childNodes[0].childNodes[2].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [["a", "b"], "test"]))
		return root.childNodes[0].childNodes[1].nodeValue === "b" && root.childNodes[0].childNodes[2].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", [m("span"), m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeName === "SPAN"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", ["test", m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", [m.trust("test"), m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/55
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("#b"))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/56
		var root = mock.document.createElement("div")
		m.render(root, [null, "foo"])
		m.render(root, ["bar"])
		return root.childNodes.length == 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/56
		var root = mock.document.createElement("div")
		m.render(root, m("div", "foo"))
		return root.childNodes.length == 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("button"), m("ul")]))
		var valueBefore = root.childNodes[0].childNodes[0].nodeName
		m.render(root, m("div", [undefined, m("ul")]))
		var valueAfter = root.childNodes[0].childNodes[0].nodeValue
		return valueBefore === "BUTTON" && valueAfter === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("ul"), undefined]))
		var valueBefore1 = root.childNodes[0].childNodes[0].nodeName
		var valueBefore2 = root.childNodes[0].childNodes[1].nodeValue
		m.render(root, m("div", [undefined, m("ul")]))
		var valueAfter1 = root.childNodes[0].childNodes[0].nodeValue
		var valueAfter2 = root.childNodes[0].childNodes[1].nodeName
		return valueBefore1 === "UL" && valueAfter1 === "" && valueBefore2 === "" && valueAfter2 === "UL"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/79
		var root = mock.document.createElement("div")
		m.render(root, m("div", {style: {background: "red"}}))
		var valueBefore = root.childNodes[0].style.background
		m.render(root, m("div", {style: {}}))
		var valueAfter = root.childNodes[0].style.background
		return valueBefore === "red" && valueAfter === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div[style='background:red']"))
		return root.childNodes[0].style === "background:red"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {style: {background: "red"}}))
		var valueBefore = root.childNodes[0].style.background
		m.render(root, m("div", {}))
		var valueAfter = root.childNodes[0].style.background
		return valueBefore === "red" && valueAfter === undefined
	})
	test(function() {
		var root = mock.document.createElement("div")
		var module = {}, unloaded = false
		module.controller = function() {
			this.onunload = function() {unloaded = true}
		}
		module.view = function() {}
		m.module(root, module)
		m.module(root, {controller: function() {}, view: function() {}})
		return unloaded === true
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/87
		var root = mock.document.createElement("div")
		m.render(root, m("div", [[m("a"), m("a")], m("button")]))
		m.render(root, m("div", [[m("a")], m("button")]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeName == "BUTTON"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/87
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("a"), m("b"), m("button")]))
		m.render(root, m("div", [m("a"), m("button")]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeName == "BUTTON"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/99
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("img"), m("h1")]))
		m.render(root, m("div", [m("a")]))
		return root.childNodes[0].childNodes.length == 1 && root.childNodes[0].childNodes[0].nodeName == "A"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", "b", "c", "d"]))
		m.render(root, m("div", [["d", "e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", [["a", "b", "c", "d"]]))
		m.render(root, m("div", ["d", "e"]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["x", [["a"], "b", "c", "d"]]))
		m.render(root, m("div", ["d", ["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["b"]))
		m.render(root, m("div", [["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 1 && children[0].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", ["b"]]))
		m.render(root, m("div", ["d", [["e"]]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", [["b"]]]))
		m.render(root, m("div", ["d", ["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", [["b"], "c"]]))
		m.render(root, m("div", ["d", [[["e"]], "x"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 3 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		var root = mock.document.createElement("div")

		var success = false
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {ctx.data = 1}}))
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {success = ctx.data === 1}}))
		return success
	})
	test(function() {
		var root = mock.document.createElement("div")

		var index = 0;
		var success = true;
		var statefulConfig = function(elem, isInitialized, ctx) {ctx.data = index++}
		var node = m("div", {config: statefulConfig});
		m.render(root, [node, node]);

		index = 0;
		var checkConfig = function(elem, isInitialized, ctx) {
			success = success && (ctx.data === index++)
		}
		node = m("div", {config: checkConfig});
		m.render(root, [node, node]);
		return success;
	})
	test(function() {
		var root = mock.document.createElement("div")
		var parent
		m.render(root, m("div", m("a", {
			config: function(el) {parent = el.parentNode.parentNode}
		})));
		return parent === root
	})
	test(function() {
		var root = mock.document.createElement("div")
		var count = 0
		m.render(root, m("div", m("a", {
			config: function(el) {
				var island = mock.document.createElement("div")
				count++
				if (count > 2) throw "too much recursion..."
				m.render(island, m("div"))
			}
		})));
		return count == 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/129
		var root = mock.document.createElement("div")
		m.render(root, m("div", [["foo", "bar"], ["foo", "bar"], ["foo", "bar"]]));
		m.render(root, m("div", ["asdf", "asdf2", "asdf3"]));
		return true
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		//insert at beginning
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[0]
		m.render(root, [m("a", {key: 4}), m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstAfter = root.childNodes[1]
		return firstBefore == firstAfter && root.childNodes[0].key == 4 && root.childNodes.length == 4
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[0]
		m.render(root, [m("a", {key: 4}), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[1]
		return firstBefore == firstAfter && root.childNodes[0].key == 4 && root.childNodes.length == 3
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[1]
		m.render(root, [m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4})])
		var firstAfter = root.childNodes[0]
		return firstBefore == firstAfter && root.childNodes[0].key === "2" && root.childNodes.length === 3
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var fourthBefore = root.childNodes[3]
		m.render(root, [m("a", {key: 4}), m("a", {key: 10}), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[2]
		var secondAfter = root.childNodes[3]
		var fourthAfter = root.childNodes[0]
		return firstBefore === firstAfter && secondBefore === secondAfter && fourthBefore === fourthAfter && root.childNodes[1].key == "10" && root.childNodes.length === 4
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var fourthBefore = root.childNodes[3]
		m.render(root, [m("a", {key: 4}), m("a", {key: 10}), m("a", {key: 2}), m("a", {key: 1}), m("a", {key: 6}), m("a", {key: 7})])
		var firstAfter = root.childNodes[3]
		var secondAfter = root.childNodes[2]
		var fourthAfter = root.childNodes[0]
		return firstBefore === firstAfter && secondBefore === secondAfter && fourthBefore === fourthAfter && root.childNodes[1].key == "10" && root.childNodes[4].key == "6" && root.childNodes[5].key == "7" && root.childNodes.length === 6
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/149
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a"), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var thirdBefore = root.childNodes[2]
		var fourthBefore = root.childNodes[3]
		var fifthBefore = root.childNodes[4]
		m.render(root, [m("a", {key: 4}), m("a", {key: 5}), m("a"), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[3]
		var secondAfter = root.childNodes[4]
		var thirdAfter = root.childNodes[2]
		var fourthAfter = root.childNodes[0]
		var fifthAfter = root.childNodes[1]
		return firstBefore === firstAfter && secondBefore === secondAfter && thirdBefore === thirdAfter && fourthBefore === fourthAfter && fifthBefore === fifthAfter
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/134
		var root = mock.document.createElement("div")
		m.render(root, m("div", {contenteditable: true}, "test"))
		mock.document.activeElement = root.childNodes[0]
		m.render(root, m("div", {contenteditable: true}, "test1"))
		m.render(root, m("div", {contenteditable: false}, "test2"))
		return root.childNodes[0].childNodes[0].nodeValue === "test2"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/136
		var root = mock.document.createElement("div")
		m.render(root, m("textarea", ["test"]))
		m.render(root, m("textarea", ["test1"]))
		return root.childNodes[0].value === "test1"
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloaded = 0
		m.render(root, [
			m("div", {
				key: 1,
				config: function(el, init, ctx) {
					ctx.onunload = function() {
						unloaded++
					}
				}
			})
		])
		m.render(root, [
			m("div", {key: 2}),
			m("div", {
				key: 1,
				config: function(el, init, ctx) {
					ctx.onunload = function() {
						unloaded++
					}
				}
			})
		])
		return unloaded == 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloadedParent = 0
		var unloadedChild = 0
		var configParent = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedParent++
			}
		}
		var configChild = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedChild++
			}
		}
		var unloaded = 0
		m.render(root, m("div", {config: configParent}, m("a", {config: configChild})))
		m.render(root, m("main", {config: configParent}, m("a", {config: configChild})))
		return unloadedParent === 1 && unloadedChild === 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloadedParent = 0
		var unloadedChild = 0
		var configParent = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedParent++
			}
		}
		var configChild = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedChild++
			}
		}
		var unloaded = 0
		m.render(root, m("div", {config: configParent}, m("a", {config: configChild})))
		m.render(root, m("main", {config: configParent}, m("b", {config: configChild})))
		return unloadedParent === 1 && unloadedChild === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/150
		var root = mock.document.createElement("div")
		m.render(root, [m("a"), m("div")])
		m.render(root, [[], m("div")])
		return root.childNodes.length == 1 && root.childNodes[0].nodeName == "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/156
		var root = mock.document.createElement("div")
		m.render(root, m("div", [
			["a", "b", "c", "d"].map(function() {
				return [m("div"), " "]
			}),
			m("span")
		]))
		return root.childNodes[0].childNodes[8].nodeName == "SPAN"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/157
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 2}), m("li", {key: 4})]))
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 3}), m("li", {key: 4}), m("li", {key: 5})]))
		return root.childNodes[0].childNodes.map(function(n) {return n.key}).join("") == "012345"
	})
	//end m.render

	//m.redraw
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})
		mock.requestAnimationFrame.$resolve()
		var valueBefore = root.childNodes[0].nodeValue
		controller.value = "foo"
		m.redraw()
		mock.requestAnimationFrame.$resolve()
		return valueBefore === "" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		var count = 0
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {},
			view: function(ctrl) {
				count++
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		m.redraw() //should run synchronously
		
		m.redraw() //rest should run asynchronously since they're spamming
		m.redraw()
		m.redraw()
		mock.requestAnimationFrame.$resolve() //teardown
		return count === 3
	})

	//m.route
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test1", {
			"/test1": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test1" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.pathname = "/"

		var root = mock.document.createElement("div")
		m.route.mode = "pathname"
		m.route(root, "/test2", {
			"/test2": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.pathname == "/test2" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.hash = "#"

		var root = mock.document.createElement("div")
		m.route.mode = "hash"
		m.route(root, "/test3", {
			"/test3": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.hash == "#/test3" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test4/foo", {
			"/test4/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test4/foo" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("test")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test5/foo", {
			"/": module,
			"/test5/:test": module
		})
		var paramValueBefore = m.route.param("test")
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var paramValueAfter = m.route.param("test")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test6/foo", {
			"/": module,
			"/test6/:a1": module
		})
		var paramValueBefore = m.route.param("a1")
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var paramValueAfter = m.route.param("a1")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/61
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test7/foo", {
			"/": module,
			"/test7/:a1": module
		})
		var routeValueBefore = m.route()
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var routeValueAfter = m.route()
		mock.requestAnimationFrame.$resolve() //teardown
		return routeValueBefore === "/test7/foo" && routeValueAfter === "/"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test8/foo/SEP/bar/baz", {
			"/test8/:test/SEP/:path...": {
				controller: function() {},
				view: function() {
					return m.route.param("test") + "_" + m.route.param("path")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test8/foo/SEP/bar/baz" && root.childNodes[0].nodeValue === "foo_bar/baz"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test9/foo/bar/SEP/baz", {
			"/test9/:test.../SEP/:path": {
				controller: function() {},
				view: function() {
					return m.route.param("test") + "_" + m.route.param("path")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test9/foo/bar/SEP/baz" && root.childNodes[0].nodeValue === "foo/bar_baz"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test10/foo%20bar", {
			"/test10/:test": {
				controller: function() {},
				view: function() {
					return m.route.param("test")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return root.childNodes[0].nodeValue === "foo bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "foo"}},
			"/test11": {controller: function() {}, view: function() {return "bar"}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test11/")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test11/" && root.childNodes[0].nodeValue === "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {}},
			"/test12": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test12?a=foo&b=bar")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test12?a=foo&b=bar" && m.route.param("a") == "foo" && m.route.param("b") == "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "bar"}},
			"/test13/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test13/foo?test=bar")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test13/foo?test=bar" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "bar"}},
			"/test14": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test14?test&test2=")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test14?test&test2=" && m.route.param("test") === true && m.route.param("test2") === ""
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {}},
			"/test12": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test12", {a: "foo", b: "bar"})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test12?a=foo&b=bar" && m.route.param("a") == "foo" && m.route.param("b") == "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var route1, route2
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {route1 = m.route()}, view: function() {}},
			"/test13": {controller: function() {route2 = m.route()}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test13")
		mock.requestAnimationFrame.$resolve() //teardown
		return route1 == "/" && route2 == "/test13"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test14": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test14")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div"),
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test15": {
				controller: function() {},
				view: function() {
					return [m("div")]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test15")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test16": {
				controller: function() {},
				view: function() {
					return m("a")
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test16")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test17": {
				controller: function() {},
				view: function() {
					return m("a")
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test17")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test18": {
				controller: function() {},
				view: function() {
					return [m("a")]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test18")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 1,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test20": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 2,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test20")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 1,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test21": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test21")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/foo", {
			"/foo": {
				controller: function() {},
				view: function() {
					return m("div", "foo");
				}
			},
			"/bar": {
				controller: function() {},
				view: function() {
					return m("div", "bar");
				}
			},
		})
		mock.requestAnimationFrame.$resolve()
		var foo = root.childNodes[0].childNodes[0].nodeValue;
		m.route("/bar")
		mock.requestAnimationFrame.$resolve() //teardown
		var bar = root.childNodes[0].childNodes[0].nodeValue;
		return (foo === "foo" && bar === "bar")
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		var config = function(el, init, ctx) {
			ctx.onunload = function() {
				unloaded++
			}
		}
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {},
				view: function() {
					return m("div", m("a", {config: config}, "foo"));
				}
			},
			"/bar1": {
				controller: function() {},
				view: function() {
					return m("main", m("a", {config: config}, "foo"));
				}
			},
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/bar1")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	//end m.route

	//m.prop
	test(function() {
		var prop = m.prop("test")
		return prop() === "test"
	})
	test(function() {
		var prop = m.prop("test")
		prop("foo")
		return prop() === "foo"
	})
	test(function() {
		var prop = m.prop("test")
		return JSON.stringify(prop) === '"test"'
	})
	test(function() {
		var obj = {prop: m.prop("test")}
		return JSON.stringify(obj) === '{"prop":"test"}'
	})

	//m.request
	test(function() {
		var prop = m.request({method: "GET", url: "test"})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().method === "GET" && prop().url === "test"
	})
	test(function() {
		var prop = m.request({method: "GET", url: "test"}).then(function(value) {return "foo"})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop() === "foo"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80", data: {}}).then(function(value) {return value})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().url === "http://domain.com:80"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80/:test1", data: {test1: "foo"}}).then(function(value) {return value})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().url === "http://domain.com:80/foo"
	})
	test(function() {
		var error = m.prop("no error")
		var prop = m.request({method: "GET", url: "test", deserialize: function() {throw new Error("error occurred")}}).then(null, error)
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop() === undefined && error().message === "error occurred"
	})
	test(function() {
		var error = m.prop("no error"), exception
		var prop = m.request({method: "GET", url: "test", deserialize: function() {throw new TypeError("error occurred")}}).then(null, error)
		try {mock.XMLHttpRequest.$instances.pop().onreadystatechange()}
		catch (e) {exception = e}
		m.endComputation()
		return prop() === undefined && error() === "no error" && exception.message == "error occurred"
	})
	test(function() {
		var error = m.prop("no error")
		var prop = m.request({method: "POST", url: "test"}).then(null, error)
		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.onreadystatechange()
		return xhr.$headers["Content-Type"] == "application/json; charset=utf-8"
	})

	//m.deferred
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(function(data) {value = data})
		deferred.resolve("test")
		return value === "test"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(function(data) {return "foo"}).then(function(data) {value = data})
		deferred.resolve("test")
		return value === "foo"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(null, function(data) {value = data})
		deferred.reject("test")
		return value === "test"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(null, function(data) {return "foo"}).then(null, function(data) {value = data})
		deferred.reject("test")
		return value === "foo"
	})
	test(function() {
		var value1, value2
		var deferred = m.deferred()
		deferred.promise.then(function(data) {throw new Error}).then(function(data) {value1 = 1}, function(data) {value2 = data})
		deferred.resolve("test")
		return value1 === undefined && value2 instanceof Error
	})
	test(function() {
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		var value1, value2
		deferred1.promise.then(function(data) {
			value1 = data
			return deferred2.promise
		}).then(function(data) {
			value2 = data
		})
		deferred1.resolve(1)
		deferred2.resolve(2)
		return value1 === 1 && value2 === 2
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.resolve(1)
		deferred.promise.then(function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.reject(1)
		deferred.promise.then(null, function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.resolve(1)
		deferred.resolve(2)
		deferred.promise.then(function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.promise.then(function(data) {
			value = data
		})
		deferred.resolve(1)
		deferred.resolve(2)
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value1, value2
		deferred.promise.then(function(data) {
			value1 = data
		}, function(data) {
			value2 = data
		})
		deferred.resolve(1)
		deferred.reject(2)
		return value1 === 1 && value2 === undefined
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value1, value2
		deferred.promise.then(function() {
			value1 = data
		}, function(data) {
			value2 = data
		})
		deferred.reject(1)
		deferred.resolve(2)
		return value1 === undefined && value2 === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.promise.then(null, function(data) {
			value = data
		})
		deferred.reject(1)
		deferred.reject(2)
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/85
		var deferred = m.deferred(), value
		deferred.resolve()
		deferred.promise.then(function(data) {
			value = 1
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/85
		var deferred = m.deferred(), value
		deferred.reject()
		deferred.promise.then(null, function(data) {
			value = 1
		})
		return value === 1
	})
	test(function() {
		var deferred = m.deferred(), value
		deferred.resolve(1)
		return deferred.promise() === 1
	})
	test(function() {
		var deferred = m.deferred(), value
		var promise = deferred.promise.then(function(data) {return data + 1})
		deferred.resolve(1)
		return promise() === 2
	})
	test(function() {
		var deferred = m.deferred(), value
		deferred.reject(1)
		return deferred.promise() === undefined
	})

	//m.sync
	test(function() {
		var value
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		m.sync([deferred1.promise, deferred2.promise]).then(function(data) {value = data})
		deferred1.resolve("test")
		deferred2.resolve("foo")
		return value[0] === "test" && value[1] === "foo"
	})
	test(function() {
		var value
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		m.sync([deferred1.promise, deferred2.promise]).then(function(data) {value = data})
		deferred2.resolve("foo")
		deferred1.resolve("test")
		return value[0] === "test" && value[1] === "foo"
	})

	//m.startComputation/m.endComputation
	test(function() {
		mock.requestAnimationFrame.$resolve()

		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})

		mock.requestAnimationFrame.$resolve()

		m.startComputation()
		controller.value = "foo"
		m.endComputation()
		mock.requestAnimationFrame.$resolve()
		
		return root.childNodes[0].nodeValue === "foo"
	})

	//console.log presence
	test(function() {
		return m.deps.factory.toString().indexOf("console") < 0
	})

	// config context
	test(function() {
		var root = mock.document.createElement("div")

		var success = false;
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {ctx.data=1}}));
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {success = ctx.data===1}}));
		return success;
	})

	// more complex config context
	test(function() {
		var root = mock.document.createElement("div")

		var idx = 0;
		var success = true;
		var statefulConfig = function(elem, isInitialized, ctx) {ctx.data=idx++}
		var node = m("div", {config: statefulConfig});
		m.render(root, [node, node]);

		idx = 0;
		var checkConfig = function(elem, isInitialized, ctx) {
			success = success && (ctx.data === idx++)
		}
		node = m("div", {config: checkConfig});
		m.render(root, [node, node]);
		return success;
	})

}

//mocks
testMithril(mock.window)

test.print(console.log)
