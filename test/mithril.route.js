describe("m.route()", function () {
	"use strict"

	// Use this instead of m.route() unless you have to call m.route and do
	// something else in the same frame.
	function route() {
		var res = m.route.apply(null, arguments)
		mock.requestAnimationFrame.$resolve()
		return res
	}

	var mode = (function () {
		var types = {
			search: "?",
			hash: "#",
			pathname: "/"
		}

		return function (type) {
			if (!{}.hasOwnProperty.call(types, type)) {
				throw new RangeError("bad mode type")
			}
			mock.location[type] = types[type]
			m.route.mode = type
		}
	})()

	// Little helper utility
	function noop() {}

	// Use this if all you need to do is render a view (i.e. a pure component).
	function pure(view) {
		return {
			controller: noop,
			view: view
		}
	}

	// Use these instead of `it` and `xit` in this set of tests if you need a
	// root element.
	var dit = makeIt(it)
	var xdit = makeIt(xit)

	// Wraps the `it` function for dependency injection that doesn't require
	// `this`
	/* eslint-disable no-invalid-this */
	function makeIt(it) {
		return function (name, callback) {
			return it(name, function () {
				var args = [this.root]
				for (var i = 0; i < arguments.length; i++) {
					args.push(arguments[i])
				}
				callback.apply(null, args)
			})
		}
	}

	beforeEach(function () {
		mock.requestAnimationFrame.$resolve()
		this.root = mock.document.createElement("div")
	})

	afterEach(function () {
		m.mount(this.root, null)
	})
	/* eslint-enable no-invalid-this */

	it("exists", function () {
		expect(m.route).to.be.a("function")
	})

	dit("routes to the right location by default", function (root) {
		mode("search")

		route(root, "/test1", {
			"/test1": pure(function () { return "foo" })
		})

		expect(mock.location.search).to.equal("?/test1")
		expect(root.childNodes[0].nodeValue).to.equal("foo")
	})

	dit("gets the right right location when routed to it", function (root) {
		mode("search")

		var route1, route2
		route(root, "/", {
			"/": {
				controller: function () { route1 = m.route() },
				view: noop
			},
			"/test13": {
				controller: function () { route2 = m.route() },
				view: noop
			}
		})

		m.route("/test13")

		expect(route1).to.equal("/")
		expect(route2).to.equal("/test13")
	})

	dit("skips route change if component ctrl.onunload calls preventDefault", function (root) { // eslint-disable-line
		mode("search")
		var spy = sinon.spy()

		var sub = {
			controller: function () {
				this.onunload = function (e) { e.preventDefault() }
			},
			view: function () {
				return m("div")
			}
		}

		route(root, "/a", {
			"/a": pure(function () { return sub }),

			"/b": {
				controller: spy,
				view: noop
			}
		})

		route("/b")

		expect(spy).to.not.have.been.called
		expect(m.route()).to.equal("/a")
	})

	dit("skips route change if subcomponent ctrl.onunload calls preventDefault", function (root) { // eslint-disable-line
		mode("search")

		var spy = sinon.spy()

		var subsub = {
			controller: function () {
				this.onunload = function (e) { e.preventDefault() }
			},
			view: function () {
				return m("div")
			}
		}

		var sub = pure(function () { return subsub })

		route(root, "/a", {
			"/a": pure(function () { return sub }),

			"/b": {
				controller: spy,
				view: noop
			}
		})

		route("/b")

		expect(spy).to.not.have.been.called
		expect(m.route()).to.equal("/a")
	})

	dit("initializes a component's constructor on route change", function (root) { // eslint-disable-line
		mode("search")

		var ctrl1 = sinon.spy()
		var ctrl2 = sinon.spy()

		var sub1 = {
			controller: ctrl1,
			view: function () { return m("div") }
		}

		var sub2 = {
			controller: ctrl2,
			view: function () { return m("div") }
		}

		route(root, "/a", {
			"/a": pure(function () {
				return m(".page-a", [
					m("h1"), m.component(sub1, {x: 11})
				])
			}),

			"/b": pure(function () {
				return m(".page-b", [
					m("h2"), m.component(sub2, {y: 22})
				])
			})
		})

		route("/b")
		route("/a")

		expect(ctrl1).to.have.been.calledTwice
		expect(ctrl2).to.have.been.calledOnce
	})

	dit("doesn't require components to have a view", function (root) {
		mode("search")

		var Component = pure(function () { return m(".comp") })

		route(root, "/foo", {
			"/foo": pure(function () { return [Component] })
		})

		expect(root.childNodes[0].nodeName).to.equal("DIV")
	})

	// https://github.com/lhorie/mithril.js/issues/555
	dit("reinstantiates the controller when redraw strategy is `all`", function (root) {  // eslint-disable-line
		var MyComponent = {
			controller: function (args) {
				this.name = args.name
			},

			view: function (ctrl) {
				return m("div", ctrl.name)
			}
		}

		route(root, "/", {
			"/": pure(function () {
				return m("div", [
					m("a[href=/]", {config: m.route}, "foo"),
					m("a[href=/bar]", {config: m.route}, "bar"),
					m.component(MyComponent, {name: "Jane"})
				])
			}),

			"/bar": pure(function () {
				return m("div", [
					m("a[href=/]", {config: m.route}, "foo"),
					m("a[href=/bar]", {config: m.route}, "bar"),
					m.component(MyComponent, {name: "Bob"})
				])
			})
		})

		route("/bar")

		expect(root.childNodes[0].childNodes[2].childNodes[0].nodeValue)
			.to.equal("Bob")
	})

	dit("sets the correct href with config: m.route", function (root) {
		mode("pathname")

		route(root, "/test2", {
			"/test2": pure(function () {
				return [
					"foo",
					m("a", {href: "/test2", config: m.route}, "Test2")
				]
			})
		})

		expect(mock.location.pathname).to.equal("/test2")
		expect(root.childNodes[0].nodeValue).to.equal("foo")
		expect(root.childNodes[1].href).to.equal("/test2")
	})

	dit("can use a hash", function (root) {
		mode("hash")

		route(root, "/test3", {
			"/test3": pure(function () { return "foo" })
		})

		expect(mock.location.hash).to.equal("#/test3")
		expect(root.childNodes[0].nodeValue).to.equal("foo")
	})

	dit("can use a query", function (root) {
		mode("search")

		route(root, "/test4/foo", {
			"/test4/:test": pure(function () { return m.route.param("test") })
		})

		expect(mock.location.search).to.equal("?/test4/foo")
		expect(root.childNodes[0].nodeValue).to.equal("foo")
	})

	context("m.route.param()", function () {
		it("exists", function () {
			expect(m.route.param).to.be.a("function")
		})

		dit("can get params (1)", function (root) {
			mode("search")

			var component = pure(function () { return m.route.param("test") })

			m.route(root, "/test5/foo", {
				"/": component,
				"/test5/:test": component
			})

			var paramValueBefore = m.route.param("test")

			mock.requestAnimationFrame.$resolve()
			m.route("/")

			var paramValueAfter = m.route.param("test")

			mock.requestAnimationFrame.$resolve()

			expect(mock.location.search).to.equal("?/")
			expect(paramValueBefore).to.equal("foo")
			expect(paramValueAfter).to.not.exist
		})

		dit("can deal with params (2)", function (root) {
			mode("search")

			var component = pure(function () { return m.route.param("a1") })

			m.route(root, "/test6/foo", {
				"/": component,
				"/test6/:a1": component
			})

			var paramValueBefore = m.route.param("a1")

			mock.requestAnimationFrame.$resolve()
			m.route("/")

			var paramValueAfter = m.route.param("a1")

			mock.requestAnimationFrame.$resolve()

			expect(mock.location.search).to.equal("?/")
			expect(paramValueBefore).to.equal("foo")
			expect(paramValueAfter).to.not.exist
		})

		// https://github.com/lhorie/mithril.js/issues/61
		dit("can get the route via m.route()", function (root) {
			mode("search")

			var component = pure(function () { return m.route.param("a1") })

			m.route(root, "/test7/foo", {
				"/": component,
				"/test7/:a1": component
			})

			var routeValueBefore = m.route()

			mock.requestAnimationFrame.$resolve()
			m.route("/")

			var routeValueAfter = m.route()

			mock.requestAnimationFrame.$resolve()

			expect(routeValueBefore).to.equal("/test7/foo")
			expect(routeValueAfter).to.equal("/")
		})

		dit("can deal with rest paths at the end", function (root) {
			mode("search")

			route(root, "/test8/foo/SEP/bar/baz", {
				"/test8/:test/SEP/:path...": pure(function () {
					return m.route.param("test") + "_" + m.route.param("path")
				})
			})

			expect(mock.location.search).to.equal("?/test8/foo/SEP/bar/baz")
			expect(root.childNodes[0].nodeValue).to.equal("foo_bar/baz")
		})

		dit("can deal with rest paths in the middle", function (root) {
			mode("search")

			route(root, "/test9/foo/bar/SEP/baz", {
				"/test9/:test.../SEP/:path": pure(function () {
					return m.route.param("test") + "_" + m.route.param("path")
				})
			})

			expect(mock.location.search).to.equal("?/test9/foo/bar/SEP/baz")
			expect(root.childNodes[0].nodeValue).to.equal("foo/bar_baz")
		})

		dit("unescapes urls for m.route.param()", function (root) {
			mode("search")

			route(root, "/test10/foo%20bar", {
				"/test10/:test": pure(function () {
					return m.route.param("test")
				})
			})

			expect(root.childNodes[0].nodeValue).to.equal("foo bar")
		})

		dit("renders the correct path", function (root) {
			mode("search")

			route(root, "/", {
				"/": pure(function () { return "foo" }),
				"/test11": pure(function () { return "bar" })
			})

			route("/test11/")

			expect(mock.location.search).to.equal("?/test11/")
			expect(root.childNodes[0].nodeValue).to.equal("bar")
		})

		dit("reads params by parsing query string", function (root) {
			mode("search")

			route(root, "/", {
				"/": pure(noop),
				"/test12": pure(noop)
			})

			route("/test12?a=foo&b=bar")

			expect(mock.location.search).to.equal("?/test12?a=foo&b=bar")
			expect(m.route.param("a")).to.equal("foo")
			expect(m.route.param("b")).to.equal("bar")
		})

		dit("prefers local params to global params", function (root) {
			mode("search")

			route(root, "/", {
				"/": pure(function () { return "bar" }),
				"/test13/:test": pure(function () {
					return m.route.param("test")
				})
			})

			route("/test13/foo?test=bar")

			expect(mock.location.search).to.equal("?/test13/foo?test=bar")
			expect(root.childNodes[0].nodeValue).to.equal("foo")
		})

		dit("reads global params", function (root) {
			mode("search")

			route(root, "/", {
				"/": pure(function () { return "bar" }),
				"/test14": pure(function () { return "foo" })
			})

			route("/test14?test&test2=")

			expect(mock.location.search).to.equal("?/test14?test&test2=")
			expect(m.route.param("test")).to.not.exist
			expect(m.route.param("test2")).to.equal("")
		})

		dit("parses params when using m.route(path, params)", function (root) {
			mode("search")

			route(root, "/", {
				"/": pure(noop),
				"/test12": pure(noop)
			})

			route("/test12", {a: "foo", b: "bar"})

			expect(mock.location.search).to.equal("?/test12?a=foo&b=bar")
			expect(m.route.param("a")).to.equal("foo")
			expect(m.route.param("b")).to.equal("bar")
		})

		dit("gets params object by using m.route.param()", function (root) {
			mode("search")

			route(root, "/", {
				"/": pure(noop),
				"/test12": pure(noop)
			})

			route("/test12", {a: "foo", b: "bar"})

			var params = m.route.param()

			expect(params.a).to.equal("foo")
			expect(params.b).to.equal("bar")
		})
	})

	dit("only calls onunload once when routed away (1)", function (root) {
		mode("search")

		var onunload = sinon.spy()

		route(root, "/", {
			"/": pure(function () {
				return m("div", {
					config: function (el, init, ctx) {
						ctx.onunload = onunload
					}
				})
			}),
			"/test14": pure(noop)
		})

		route("/test14")

		expect(onunload).to.be.calledOnce
	})

	dit("only calls onunload once when routed away (2)", function (root) {
		mode("search")

		var onunload = sinon.spy()

		route(root, "/", {
			"/": pure(function () {
				return [
					m("div"),
					m("div", {
						config: function (el, init, ctx) {
							ctx.onunload = onunload
						}
					})
				]
			}),
			"/test15": pure(function () { return [m("div")] })
		})

		route("/test15")

		expect(onunload).to.be.calledOnce
	})

	dit("only calls onunload once when routed away (3)", function (root) {
		mode("search")

		var onunload = sinon.spy()

		route(root, "/", {
			"/": pure(function () {
				return m("div", {
					config: function (el, init, ctx) {
						ctx.onunload = onunload
					}
				})
			}),
			"/test16": pure(function () { return m("a") })
		})

		route("/test16")

		expect(onunload).to.be.calledOnce
	})

	dit("only calls onunload once when routed away (4)", function (root) {
		mode("search")

		var onunload = sinon.spy()

		route(root, "/", {
			"/": pure(function () {
				return [
					m("div", {
						config: function (el, init, ctx) {
							ctx.onunload = onunload
						}
					})
				]
			}),
			"/test17": pure(function () { return m("a") })
		})

		route("/test17")

		expect(onunload).to.be.calledOnce
	})

	dit("only calls onunload once when routed away (5)", function (root) {
		mode("search")

		var onunload = sinon.spy()

		route(root, "/", {
			"/": pure(function () {
				return m("div", {
					config: function (el, init, ctx) {
						ctx.onunload = onunload
					}
				})
			}),
			"/test18": pure(function () { return [m("a")] })
		})

		route("/test18")

		expect(onunload).to.be.calledOnce
	})

	dit("only calls onunload once when routed away (6)", function (root) {
		mode("search")

		var onunload = sinon.spy()

		route(root, "/", {
			"/": pure(function () {
				return [
					m("div", {
						key: 1,
						config: function (el, init, ctx) {
							ctx.onunload = onunload
						}
					})
				]
			}),
			"/test20": pure(function () {
				return [
					m("div", {
						key: 2,
						config: function (el, init, ctx) {
							ctx.onunload = onunload
						}
					})
				]
			})
		})

		route("/test20")

		expect(onunload).to.be.calledOnce
	})

	dit("only calls onunload once when routed away (7)", function (root) {
		mode("search")

		var onunload = sinon.spy()

		route(root, "/", {
			"/": pure(function () {
				return [
					m("div", {
						key: 1,
						config: function (el, init, ctx) {
							ctx.onunload = onunload
						}
					})
				]
			}),
			"/test21": pure(function () {
				return [
					m("div", {
						config: function (el, init, ctx) {
							ctx.onunload = onunload
						}
					})
				]
			})
		})

		route("/test21")

		expect(onunload).to.be.calledOnce
	})

	dit("renders the right virtual node when routed to it", function (root) {
		mode("search")

		route(root, "/foo", {
			"/foo": pure(function () { return m("div", "foo") }),
			"/bar": pure(function () { return m("div", "bar") })
		})
		var foo = root.childNodes[0].childNodes[0].nodeValue

		route("/bar")
		var bar = root.childNodes[0].childNodes[0].nodeValue

		expect(foo).to.equal("foo")
		expect(bar).to.equal("bar")
	})

	dit("keeps identity with unchanged nodes", function (root) {
		mode("search")

		var onunload = sinon.spy()
		function config(el, init, ctx) {
			ctx.onunload = onunload
		}

		route(root, "/foo1", {
			"/foo1": pure(function () {
				return m("div", m("a", {config: config}, "foo"))
			}),
			"/bar1": pure(function () {
				return m("main", m("a", {config: config}, "foo"))
			})
		})

		route("/bar1")

		expect(onunload).to.be.calledOnce
	})

	dit("allows illegal URL characters in paths", function (root) {
		mode("search")

		var value
		m.route(root, "/foo+bar", {
			"/:arg": {
				controller: function () { value = m.route.param("arg") },
				view: function () {
					return ""
				}
			}
		})
		expect(value).to.equal("foo+bar")
	})

	dit("allows trailing slashes in paths", function (root) {
		mode("search")

		route(root, "/", {
			"/": pure(function () { return "foo" }),
			"/test22": pure(function () { return "bar" })
		})

		m.route("/test22/")

		expect(mock.location.search).to.equal("?/test22/")
		expect(root.childNodes[0].nodeValue).to.equal("bar")
	})

	dit("reads non-primitive String objects in route changes", function (root) {
		mode("search")

		route(root, "/", {
			"/": pure(function () { return "foo" }),
			"/test23": pure(function () { return "bar" })
		})

		route(new String("/test23/")) // eslint-disable-line no-new-wrappers

		expect(mock.location.search).to.equal("?/test23/")
		expect(root.childNodes[0].nodeValue).to.equal("bar")
	})

	dit("reads primitive Strings in default routes", function (root) {
		mode("search")

		var value
		m.route(root, "/foo+bar", {
			"/:arg": {
				controller: function () { value = m.route.param("arg") },
				view: function () {
					return ""
				}
			}
		})
		expect(value).to.equal("foo+bar")
	})

	dit("reads non-primitive Strings in default routes", function (root) {
		mode("search")

		var value
		m.route(root, new String("/foo+bar"), { // eslint-disable-line
			"/:arg": {
				controller: function () { value = m.route.param("arg") },
				view: function () {
					return ""
				}
			}
		})

		expect(value).to.equal("foo+bar")
	})

	dit("can redirect to another route while loading default", function (root) { // eslint-disable-line
		mode("search")

		route(root, "/a", {
			"/a": {
				controller: function () { m.route("/b") },
				view: function () { return "a" }
			},

			"/b": pure(function () { return "b" })
		})

		expect(root.childNodes[0].nodeValue).to.equal("b")
	})

	dit("can redirect to another route with params while loading default", function (root) { // eslint-disable-line
		mode("search")

		route(root, "/", {
			"/": {
				controller: function () {
					m.route("/b?foo=1", {foo: 2})
				},
				view: function () { return "a" }
			},
			"/b": pure(function () { return "b" })
		})

		expect(mock.location.search).to.equal("?/b?foo=2")
	})

	dit("modifies history when changing route", function (root) {
		mode("search")
		mock.history.$$length = 0

		route(root, "/a", {
			"/a": pure(function () { return "a" }),
			"/b": pure(function () { return "b" })
		})

		route("/b")

		expect(mock.history.$$length).to.equal(1)
	})

	dit("doesn't modify history when redirecting to same route", function (root) { // eslint-disable-line
		mode("search")
		mock.history.$$length = 0

		route(root, "/a", {
			"/a": pure(function () { return "a" }),
			"/b": pure(function () { return "b" })
		})

		route("/a")

		expect(mock.history.$$length).to.equal(0)
	})

	dit("modify history when redirecting to same route with different parameters", function(root) {
		mode("search")
		mock.history.$$length = 0

		route(root, "/a", {
			"/a": pure(function () { return "a" }),
			"/b": pure(function () { return "b" })
		})

		route("/b")
		route("/b", { foo: "bar" })

		expect(mock.history.$$length).to.equal(2)
	})

	dit("doesn't modify history when redirecting to same route with same parameters", function(root) {
		mode("search")
		mock.history.$$length = 0

		route(root, "/a", {
			"/a": pure(function () { return "a" }),
			"/b": pure(function () { return "b" })
		})

		route("/b", { foo: "bar" })
		route("/b", { foo: "bar" })

		expect(mock.history.$$length).to.equal(1)
	})

	context("m.route.strategy() === \"all\", identical views", function () {
		context("parent nodes", function () {
			dit("renders routes independently", function (root) {
				mode("search")
				var initCount = 0

				var a = pure(function () {
					return m("a", {
						config: function (el, init) {
							if (!init) initCount++
						}
					})
				})

				route(root, "/a", {
					"/a": a,
					"/b": pure(a.view)
				})

				route("/b")

				expect(initCount).to.equal(2)
			})

			dit("renders routes independently with `context.retain === false`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0

				var a = pure(function () {
					return m("a", {
						config: function (el, init, ctx) {
							ctx.retain = false
							if (!init) initCount++
						}
					})
				})

				route(root, "/a", {
					"/a": a,
					"/b": pure(a.view)
				})

				route("/b")

				expect(initCount).to.equal(2)
			})

			dit("renders routes independently with `context.retain === true`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0

				var a = pure(function () {
					return m("a", {
						config: function (el, init, ctx) {
							ctx.retain = true
							if (!init) initCount++
						}
					})
				})

				route(root, "/a", {
					"/a": a,
					"/b": pure(a.view)
				})

				route("/b")

				expect(initCount).to.equal(1)
			})
		})

		context("child nodes", function () {
			dit("reinitialize unchanged child nodes without `context.retain`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0

				function config(el, init) {
					if (!init) initCount++
				}

				route(root, "/a", {
					"/a": pure(function () {
						return m("div", m("a", {config: config}))
					}),
					"/b": pure(function () {
						return m("section", m("a", {config: config}))
					})
				})

				route("/b")

				expect(initCount).to.equal(2)
			})

			dit("doesn't reinitialize unchanged child nodes with `context.retain === true`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0
				function config(el, init, ctx) {
					ctx.retain = true
					if (!init) initCount++
				}

				route(root, "/a", {
					"/a": pure(function () {
						return m("div", m("a", {config: config}))
					}),
					"/b": pure(function () {
						return m("section", m("a", {config: config}))
					})
				})

				route("/b")

				expect(initCount).to.equal(1)
			})

			dit("reinitializes unchanged child nodes with `context.retain === false`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0
				function config(el, init, ctx) {
					ctx.retain = false
					if (!init) initCount++
				}

				route(root, "/a", {
					"/a": pure(function () {
						return m("div", m("a", {config: config}))
					}),
					"/b": pure(function () {
						return m("section", m("a", {config: config}))
					})
				})

				route("/b")

				expect(initCount).to.equal(2)
			})
		})
	})

	context("m.route.strategy() === \"diff\"", function () {
		function diff(view) {
			return {
				controller: function () { m.redraw.strategy("diff") },
				view: view
			}
		}

		context("parent nodes", function () {
			dit("renders routes independently", function (root) {
				mode("search")
				var initCount = 0

				var a = diff(function () {
					return m("a", {
						config: function (el, init) {
							if (!init) initCount++
						}
					})
				})

				route(root, "/a", {
					"/a": a,
					"/b": diff(a.view)
				})

				route("/b")

				expect(initCount).to.equal(1)
			})

			dit("renders routes independently with `context.retain === false`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0

				var a = diff(function () {
					return m("a", {
						config: function (el, init, ctx) {
							ctx.retain = true
							if (!init) initCount++
						}
					})
				})

				route(root, "/a", {
					"/a": a,
					"/b": diff(a.view)
				})

				route("/b")

				expect(initCount).to.equal(1)
			})

			dit("renders routes independently with `context.retain === true`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0

				var a = diff(function () {
					return m("a", {
						config: function (el, init, ctx) {
							ctx.retain = false
							if (!init) initCount++
						}
					})
				})

				route(root, "/a", {
					"/a": a,
					"/b": diff(a.view)
				})

				route("/b")

				expect(initCount).to.equal(2)
			})
		})

		context("child nodes", function () {
			dit("reinitialize unchanged child nodes without `context.retain`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0

				function config(el, init) {
					if (!init) initCount++
				}

				route(root, "/a", {
					"/a": diff(function () {
						return m("div", m("a", {config: config}))
					}),
					"/b": diff(function () {
						return m("section", m("a", {config: config}))
					})
				})

				route("/b")

				expect(initCount).to.equal(1)
			})

			dit("doesn't reinitialize unchanged child nodes with `context.retain === true`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0

				function config(el, init, ctx) {
					ctx.retain = true
					if (!init) initCount++
				}

				route(root, "/a", {
					"/a": diff(function () {
						return m("div", m("a", {config: config}))
					}),
					"/b": diff(function () {
						return m("section", m("a", {config: config}))
					})
				})

				route("/b")

				expect(initCount).to.equal(1)
			})

			dit("reinitializes unchanged child nodes with `context.retain === false`", function (root) { // eslint-disable-line
				mode("search")
				var initCount = 0

				function config(el, init, ctx) {
					ctx.retain = false
					if (!init) initCount++
				}

				route(root, "/a", {
					"/a": diff(function () {
						return m("div", m("a", {config: config}))
					}),
					"/b": diff(function () {
						return m("section", m("a", {config: config}))
					})
				})

				m.route("/b")

				expect(initCount).to.equal(2)
			})
		})
	})

	dit("honors retain flag inside child components during route change", function (root) { // eslint-disable-line
		mode("search")
		var initCount = 0

		function config(el, init, ctx) {
			ctx.retain = true
			if (!init) initCount++
		}

		var a = pure(function () {
			return m("div", m("a", {config: config}))
		})

		var b = {
			controller: function () { m.redraw.strategy("diff") },
			view: function () {
				return m("section", m("a", {config: config}))
			}
		}

		route(root, "/a", {
			"/a": pure(function () { return m("div", a) }),
			"/b": pure(function () { return m("div", b) })
		})

		route("/b")

		expect(initCount).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/pull/571
	dit("clears nodes with config on route change", function (root) {
		mode("search")

		route(root, "/a", {
			"/a": pure(function () {
				return m("div", {
					config: function (el) {
						el.childNodes[0].modified = true
					}
				}, m("div"))
			}),
			"/b": pure(function () { return m("div", m("div")) })
		})

		route("/b")

		expect(root.childNodes[0].childNodes[0])
			.to.not.have.property("modified")
	})
})
