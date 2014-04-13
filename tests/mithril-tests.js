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
		m.render(root, m("div", {id: "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {id: "b"}))
		var elementAfter = root.childNodes[0]
		return elementBefore === elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("#b"))
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
		return root.childNodes[0].childNodes.length === 0
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
		return root.childNodes[0].childNodes.length === 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li"), m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		return root.childNodes[0].childNodes.length === 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [undefined]))
		return root.childNodes[0].childNodes.length === 0
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
		//https://github.com/lhorie/mithril.js/issues/44
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeName === "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", ["test", m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeName === "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44
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
	//end m.render
	
	//m.redraw
	test(function() {
		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})
		controller.value = "foo"
		m.redraw()
		return root.childNodes[0].nodeValue === "foo"
	})

	//m.route
	test(function() {
		mock.performance.$elapse(50)
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test1", {
			"/test1": {controller: function() {}, view: function() {return "foo"}}
		})
		return mock.location.search == "?/test1" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50)
		mock.location.pathname = "/"
		
		var root = mock.document.createElement("div")
		m.route.mode = "pathname"
		m.route(root, "/test2", {
			"/test2": {controller: function() {}, view: function() {return "foo"}}
		})
		return mock.location.pathname == "/test2" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50)
		mock.location.hash = "#"
		
		var root = mock.document.createElement("div")
		m.route.mode = "hash"
		m.route(root, "/test3", {
			"/test3": {controller: function() {}, view: function() {return "foo"}}
		})
		return mock.location.hash == "#/test3" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50)
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test4/foo", {
			"/test4/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		return mock.location.search == "?/test4/foo" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50)
		mock.location.search = "?"
		
		var module = {controller: function() {}, view: function() {return m.route.param("test")}}
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test5/foo", {
			"/": module,
			"/test5/:test": module
		})
		var paramValueBefore = m.route.param("test")
		m.route("/")
		var paramValueAfter = m.route.param("test")
		
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		mock.performance.$elapse(50)
		mock.location.search = "?"
		
		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test6/foo", {
			"/": module,
			"/test6/:a1": module
		})
		var paramValueBefore = m.route.param("a1")
		m.route("/")
		var paramValueAfter = m.route.param("a1")
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})

	//m.prop
	test(function() {
		var prop = m.prop("test")
		return prop() === "test"
	})
	test(function() {
		var prop = m.prop("test")
		prop("foo")
		return prop() == "foo"
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
}

//mocks
testMithril(mock.window)

test.print(console.log)