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
	test(function() {return m("div", m("div")).attrs.tag === "div"}) //yes, this is expected behavior: see method signature
	test(function() {return m("div", [undefined]).tag === "div"})
	test(function() {return m("div", [{foo: "bar"}])}) //as long as it doesn't throw errors, it's fine
	test(function() {return m("svg", [m("g")])})
	test(function() {return m("svg", [m("a[href='http://google.com']")])})

	//m.module
	test(function() {
		mock.performance.$elapse(50)
		
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
		return root.childNodes[0].childNodes[1].nodeValue === ""
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
	//end m.render
	
	//m.redraw
	test(function() {
		mock.performance.$elapse(50) //setup
		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})
		controller.value = "foo"
		m.redraw()
		var valueBefore = root.childNodes[0].nodeValue
		mock.performance.$elapse(50)
		m.redraw()
		mock.performance.$elapse(50) //teardown
		return valueBefore === "" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		var count = 0
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {},
			view: function(ctrl) {
				count++
			}
		})
		m.redraw()
		m.redraw()
		m.redraw()
		mock.performance.$elapse(50)
		m.redraw()
		mock.performance.$elapse(50) //teardown
		return count === 2
	})

	//m.route
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test1", {
			"/test1": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/test1" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.pathname = "/"
		
		var root = mock.document.createElement("div")
		m.route.mode = "pathname"
		m.route(root, "/test2", {
			"/test2": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.pathname == "/test2" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.hash = "#"
		
		var root = mock.document.createElement("div")
		m.route.mode = "hash"
		m.route(root, "/test3", {
			"/test3": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.hash == "#/test3" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test4/foo", {
			"/test4/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/test4/foo" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var module = {controller: function() {}, view: function() {return m.route.param("test")}}
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test5/foo", {
			"/": module,
			"/test5/:test": module
		})
		var paramValueBefore = m.route.param("test")
		mock.performance.$elapse(50)
		m.route("/")
		var paramValueAfter = m.route.param("test")
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test6/foo", {
			"/": module,
			"/test6/:a1": module
		})
		var paramValueBefore = m.route.param("a1")
		mock.performance.$elapse(50)
		m.route("/")
		var paramValueAfter = m.route.param("a1")
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/61
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test7/foo", {
			"/": module,
			"/test7/:a1": module
		})
		var routeValueBefore = m.route()
		mock.performance.$elapse(50)
		m.route("/")
		var routeValueAfter = m.route()
		mock.performance.$elapse(50) //teardown
		return routeValueBefore === "/test7/foo" && routeValueAfter === "/"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test8/foo/SEP/bar/baz", {
			"/test8/:test/SEP/::path": {controller: function() {}, view: function() {
				return m.route.param("test") + "_" + m.route.param("path") }}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/test8/foo/SEP/bar/baz" && root.childNodes[0].nodeValue === "foo_bar/baz"
	})

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
		var e = mock.XMLHttpRequest.$events.pop()
		e.target.onload(e)
		return prop().method === "GET" && prop().url === "test"
	})
	test(function() {
		var prop = m.request({method: "GET", url: "test"}).then(function(value) {return "foo"})
		var e = mock.XMLHttpRequest.$events.pop()
		e.target.onload(e)
		return prop() === "foo"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80", data: {}}).then(function(value) {return value})
		var e = mock.XMLHttpRequest.$events.pop()
		e.target.onload(e)
		return prop().url === "http://domain.com:80"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80/:test1", data: {test1: "foo"}}).then(function(value) {return value})
		var e = mock.XMLHttpRequest.$events.pop()
		e.target.onload(e)
		return prop().url === "http://domain.com:80/foo"
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

	//m.startComputation/m.endComputation
	test(function() {
		mock.performance.$elapse(50)
		
		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})
		
		mock.performance.$elapse(50)
		
		m.startComputation()
		controller.value = "foo"
		m.endComputation()
		return root.childNodes[0].nodeValue === "foo"
	})
	
	//console.log presence
	test(function() {
		return m.deps.factory.toString().indexOf("console") < 0
	})
}

//mocks
testMithril(mock.window)

test.print(console.log)