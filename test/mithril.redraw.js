describe("m.redraw()", function () {
	"use strict"

	beforeEach(function () {
		mock.requestAnimationFrame.$resolve()
	})

	it("exists", function () {
		expect(m.redraw).to.be.a("function")
	})

	it("correctly renders a property if the controller value changes", function () { // eslint-disable-line
		var ctx
		var root = mock.document.createElement("div")

		m.mount(root, {
			controller: function () { ctx = this }, // eslint-disable-line
			view: function (ctrl) { return ctrl.value }
		})

		mock.requestAnimationFrame.$resolve()

		var valueBefore = root.childNodes[0].nodeValue
		ctx.value = "foo"

		m.redraw()
		mock.requestAnimationFrame.$resolve()

		expect(valueBefore).to.equal("")
		expect(root.childNodes[0].nodeValue).to.equal("foo")
	})

	it("runs unnecessary redraws asynchronously", function () {
		var root = mock.document.createElement("div")
		var view = sinon.spy()

		m.mount(root, {
			controller: function () {},
			view: view
		})
		mock.requestAnimationFrame.$resolve() // teardown
		m.redraw()

		// These should run asynchronously
		m.redraw()
		m.redraw()
		m.redraw()
		mock.requestAnimationFrame.$resolve() // teardown

		expect(view).to.be.calledThrice
	})

	it("runs unnecessary forced redraws asynchronously", function () {
		var root = mock.document.createElement("div")
		var view = sinon.spy()
		m.mount(root, {
			controller: function () {},
			view: view
		})
		mock.requestAnimationFrame.$resolve() // teardown
		m.redraw(true)

		// These should run asynchronously
		m.redraw(true)
		m.redraw(true)
		m.redraw(true)
		mock.requestAnimationFrame.$resolve() // teardown

		expect(view).to.have.callCount(5)
	})

	context("m.redraw.strategy()", function () {
		// Use this instead of m.route() unless you have to call m.route and do
		// something else in the same frame.
		function route() {
			var res = m.route.apply(null, arguments)
			mock.requestAnimationFrame.$resolve()
			return res
		}

		// Little helper utility
		function noop() {}

		// Use this if all you need to do is render a view (i.e. a pure
		// component).
		function pure(view) {
			return {
				controller: noop,
				view: view
			}
		}

		// Use these instead of `it` and `xit` in this set of tests if you need
		// a root element.
		var dit = makeIt(it)

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
			mock.location.search = "?"
			m.route.mode = "search"
			this.root = mock.document.createElement("div")
		})

		afterEach(function () {
			m.mount(this.root, null)
		})
		/* eslint-enable no-invalid-this */

		it("exists", function () {
			expect(m.redraw.strategy).to.be.a("function")
		})

		dit("works with \"all\"", function (root) {
			var strategy

			route(root, "/foo1", {
				"/foo1": {
					controller: function () {
						strategy = m.redraw.strategy()
						m.redraw.strategy("none")
					},
					view: function () {
						return m("div")
					}
				}
			})

			expect(strategy).to.equal("all")
			expect(root.childNodes).to.be.empty
		})

		dit("works with \"redraw\"", function (root) {
			var count = 0
			var strategy
			function config(el, init) {
				if (!init) count++
			}

			route(root, "/foo1", {
				"/foo1": pure(function () {
					return m("div", {config: config})
				}),
				"/bar1": {
					controller: function () {
						strategy = m.redraw.strategy()
						m.redraw.strategy("redraw")
					},
					view: function () {
						return m("div", {config: config})
					}
				}
			})

			route("/bar1")

			expect(strategy).to.equal("all")
			expect(count).to.equal(1)
		})

		dit("works with \"diff\"", function (root) {
			var strategy
			m.route(root, "/foo1", {
				"/foo1": {
					controller: function () { this.number = 1 },
					view: function (ctrl) {
						return m("div", {
							onclick: function () {
								strategy = m.redraw.strategy()
								ctrl.number++
								m.redraw.strategy("none")
							}
						}, ctrl.number)
					}
				}
			})
			root.childNodes[0].onclick({})
			mock.requestAnimationFrame.$resolve()

			expect(strategy).to.equal("diff")
			expect(root.childNodes[0].childNodes[0].nodeValue).to.equal("1")
		})

		dit("recreates the component when \"all\"", function (root) {
			var count = 0
			function config(el, init) {
				if (!init) count++
			}

			m.route(root, "/foo1", {
				"/foo1": pure(function () {
					return m("div", {
						config: config,
						onclick: function () {
							m.redraw.strategy("all")
						}
					})
				})
			})
			root.childNodes[0].onclick({})
			mock.requestAnimationFrame.$resolve()

			expect(count).to.equal(2)
		})
	})
})
