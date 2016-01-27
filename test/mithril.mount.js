describe("m.mount()", function () {
	"use strict"

	// This is a frequent idiom
	function refresh(force) {
		m.redraw(!!force)
		mock.requestAnimationFrame.$resolve()
	}

	function clear(root) {
		m.mount(root, null)
		mock.requestAnimationFrame.$resolve()
	}

	function mount(root, mod) {
		var res = m.mount(root, mod)
		mock.requestAnimationFrame.$resolve()
		return res
	}

	// This is extremely frequent in the tests
	function pure(view) {
		return {
			controller: function () {},
			view: view
		}
	}

	it("exists", function () {
		expect(m.mount).to.be.a("function")
	})

	it("mounts onto the root", function () {
		var root = mock.document.createElement("div")
		var whatever = 1

		var app = pure(function () {
			return [
				whatever % 2 ? m("span", "% 2") : undefined,
				m("div", "bugs"),
				m("a")
			]
		})

		mount(root, app)

		whatever++
		refresh()

		whatever++
		refresh()

		expect(root.childNodes).to.have.length.above(0)
	})

	it("reloads components correctly", function () {
		mock.requestAnimationFrame.$resolve()

		var root1 = mock.document.createElement("div")
		var controller1 = sinon.spy(function () { this.value = "test1" }) // eslint-disable-line
		var view1 = sinon.stub().returns("test1")

		var mod1 = m.mount(root1, {
			controller: controller1,
			view: view1
		})

		var controller2 = sinon.spy(function () { this.value = "test2" }) // eslint-disable-line
		var view2 = sinon.stub().returns("test2")
		var root2 = mock.document.createElement("div")

		var mod2 = mount(root2, {
			controller: controller2,
			view: view2
		})

		expect(controller1).to.have.been.called
		expect(view1).to.have.been.called
		expect(controller2).to.have.been.called
		expect(view2).to.have.been.called

		expect(root1.childNodes[0].nodeValue).to.equal("test1")
		expect(root2.childNodes[0].nodeValue).to.equal("test2")
		expect(mod1).to.have.property("value", "test1")
		expect(mod2).to.have.property("value", "test2")
	})

	it("triggers an unload when the element is removed", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var spy = sinon.spy()

		mount(root, {
			controller: function () {
				this.onunload = spy
			},
			view: function () {}
		})

		clear(root)

		expect(spy).to.have.been.called
	})

	it("passes the args to both component & view", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var ctrlSpy = sinon.spy()
		var viewSpy = sinon.stub().returns(m("div"))

		var component = {
			controller: ctrlSpy,
			view: viewSpy
		}

		var arg = {}

		mount(root, m.component(component, arg))

		expect(ctrlSpy).to.have.been.calledWith(arg)
		expect(viewSpy.firstCall.args[1]).to.equal(arg)
	})

	it("mounts a component without a controller", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var arg = {}
		var spy = sinon.spy()

		var component = pure(spy)

		mount(root, m.component(component, arg))

		expect(spy.firstCall.args[1]).to.equal(arg)
	})

	it("only runs a component controller once", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var ctrlSpy = sinon.spy()
		var viewSpy = sinon.stub().returns(m("div"))

		var sub = {
			controller: ctrlSpy,
			view: viewSpy
		}

		mount(root, pure(function () { return sub }))

		refresh(true)

		expect(ctrlSpy).to.have.been.calledOnce
		expect(viewSpy).to.have.been.calledTwice
	})

	it("only runs a subcomponent controller once", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var ctrl1 = sinon.spy()
		var view1 = sinon.stub().returns(m("div"))

		var subsub = {
			controller: ctrl1,
			view: view1
		}

		var ctrl2 = sinon.spy()
		var view2 = sinon.stub().returns(subsub)

		var sub = {
			controller: ctrl2,
			view: view2
		}

		mount(root, pure(function () { return sub }))

		refresh(true)

		expect(ctrl1).to.have.been.calledOnce
		expect(ctrl2).to.have.been.calledOnce
		expect(view1).to.have.been.calledTwice
		expect(view2).to.have.been.calledTwice
	})

	it("addresses keys in components", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var list = [1, 2, 3]

		var sub = pure(function () { return m("div") })

		m.mount(root, pure(function () {
			return list.map(function (i) {
				return m.component(sub, {key: i})
			})
		}))

		var firstBefore = root.childNodes[0]

		mock.requestAnimationFrame.$resolve()

		list.reverse()
		refresh(true)

		expect(root.childNodes[2]).to.equal(firstBefore)
	})

	it("addresses keys in subcomponents correctly", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var list = [1, 2, 3]

		var subsub = pure(function () { return m("div") })

		var sub = pure(function () { return subsub })

		m.mount(root, pure(function () {
			return list.map(function (i) {
				return m.component(sub, {key: i})
			})
		}))

		var firstBefore = root.childNodes[0]

		mock.requestAnimationFrame.$resolve()

		list.reverse()
		refresh(true)

		expect(root.childNodes[2]).to.equal(firstBefore)
	})

	it("is error resistant with keys in components", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var list = [1, 2, 3]

		var sub = pure(function () { return m("div", {key: 1}) })

		m.mount(root, pure(function () {
			return list.map(function (i) {
				return m.component(sub, {key: i})
			})
		}))

		var firstBefore = root.childNodes[0]

		mock.requestAnimationFrame.$resolve()

		list.reverse()
		refresh(true)

		expect(root.childNodes[2]).to.equal(firstBefore)
	})

	it("is error resistant with keys in subcomponents", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var list = [1, 2, 3]

		var subsub = pure(function () { return m("div", {key: 1}) })

		var sub = pure(function () { return subsub })

		m.mount(root, pure(function () {
			return list.map(function (i) {
				return m.component(sub, {key: i})
			})
		}))

		var firstBefore = root.childNodes[0]

		mock.requestAnimationFrame.$resolve()

		list.reverse()
		refresh(true)

		expect(root.childNodes[2]).to.equal(firstBefore)
	})

	it("retains subcomponent identity if child of keyed element", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var list = [1, 2, 3]

		var sub = pure(function () { return m("div") })

		m.mount(root, pure(function () {
			return list.map(function (i) {
				return m("div", {key: i}, sub)
			})
		}))

		var firstBefore = root.childNodes[0].childNodes[0]

		mock.requestAnimationFrame.$resolve()

		list.reverse()
		refresh(true)

		expect(root.childNodes[2].childNodes[0]).to.equal(firstBefore)
	})

	it("calls component onunload when removed from template", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var list = [1, 2, 3]
		var spies = []

		var sub = {
			controller: function (opts) {
				this.onunload = spies[opts.key] = sinon.spy()
			},
			view: function () {
				return m("div")
			}
		}

		mount(root, pure(function () {
			return list.map(function (i) {
				return m.component(sub, {key: i})
			})
		}))

		list = []
		refresh(true)

		expect(spies[1]).to.have.been.called
		expect(spies[2]).to.have.been.called
		expect(spies[3]).to.have.been.called
	})

	it("calls subcomponent onunload when removed from template", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var list = [1, 2, 3]
		var spies1 = []
		var spies2 = []

		var subsub = {
			controller: function (opts) {
				this.onunload = spies1[opts.key] = sinon.spy()
			},
			view: function () {
				return m("div")
			}
		}

		var sub = {
			controller: function (opts) {
				this.onunload = spies2[opts.key] = sinon.spy()
			},
			view: function (ctrl, opts) {
				return m.component(subsub, {key: opts.key})
			}
		}

		mount(root, pure(function () {
			return list.map(function (i) {
				return m.component(sub, {key: i})
			})
		}))

		list = []
		refresh(true)

		expect(spies1[1]).to.have.been.called
		expect(spies1[2]).to.have.been.called
		expect(spies1[3]).to.have.been.called

		expect(spies2[1]).to.have.been.called
		expect(spies2[2]).to.have.been.called
		expect(spies2[3]).to.have.been.called
	})

	it("doesn't redraw if m.render() is called by controller constructor", function () { // eslint-disable-line
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var spy = sinon.stub().returns(m("div"))

		var sub = {
			controller: function () {
				m.redraw()
			},
			view: spy
		}

		mount(root, pure(function () { return sub }))

		expect(spy).to.have.been.called
	})

	it("doesn't redraw if m.render() is called by subcomponent controller constructor", function () { // eslint-disable-line
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var spy = sinon.stub().returns(m("div"))

		var subsub = {
			controller: function () {
				m.redraw()
			},
			view: spy
		}

		var sub = pure(function () { return subsub })

		mount(root, pure(function () { return sub }))

		expect(spy).to.have.been.called
	})

	it("renders nested components under keyed components", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var spy = sinon.stub().returns(m(".reply"))

		var Reply = pure(spy)

		var CommentList = pure(function (ctrl, props) {
			return m(".list", props.list.map(function (i) {
				return m(".comment", [
					m.component(Reply, {key: i})
				])
			}))
		})

		mount(root, pure(function () {
			return m(".outer", [
				m(".inner", m.component(CommentList, {list: [1, 2, 3]}))
			])
		}))

		expect(spy).to.have.been.calledThrice
	})

	it("calls unload when the component is replaced with another component", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		var spy = sinon.spy()

		m.mount(root, {
			controller: function () {
				this.onunload = spy
			},
			view: function () {}
		})

		m.mount(root, pure(function () {}))

		expect(spy).to.have.been.called
	})

	it("calls config with truthy init only once", function () {
		mock.requestAnimationFrame.$resolve()

		var root = mock.document.createElement("div")
		var count = 0

		mount(root, pure(function () {
			return m("div", {
				config: function (el, init) {
					if (init) count += 1
				}
			})
		}))

		refresh()

		expect(count).to.equal(1)
	})

	it("doesn't recreate node that modifies DOM in config, but stays same between redraws", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		var child = mock.document.createElement("div")

		var show = true

		function test(el, init) {
			if (!init) {
				root.appendChild(child)
			}
		}

		mount(root, pure(function () {
			return [
				m(".foo", {
					key: 1,
					config: test,
					onclick: function () { show = !show }
				}),
				show ? m(".bar", {key: 2}) : null
			]
		}))

		show = false
		refresh()

		show = true
		refresh()

		expect(root.childNodes).to.have.length(3)
	})

	it("correctly replaces nodes", function () {
		var root = mock.document.createElement("div")
		var show = true

		var sub = pure(function () { return m("div", "component") })

		mount(root, pure(function () {
			return show ? [
				m("h1", "1"),
				sub
			] : [
				m("h1", "2")
			]
		}))

		show = false
		refresh()

		show = true
		refresh()

		expect(root.childNodes).to.have.length(2)
	})

	// https://github.com/lhorie/mithril.js/issues/551
	it("only redraws a component when clicked", function () {
		var root = mock.document.createElement("div")
		var a = false
		var found = {}

		var onunload = sinon.spy()
		var view = sinon.spy(function () {
			return m("div", {config: Comp.config}, [ // eslint-disable-line
				m("div", {
					onclick: function () {
						a = !a
						m.redraw(true)
						found = root.childNodes[0].childNodes[1]
					}
				}, "asd"),
				a ? m("#a", "aaa") : null,
				"test"
			])
		})

		var Comp = {
			view: view,

			config: function (el, init, ctx) {
				if (!init) ctx.onunload = onunload
			}
		}

		m.mount(root, pure(function () { return Comp }))

		var target = root.childNodes[0].childNodes[0]

		target.onclick({currentTarget: target})
		mock.requestAnimationFrame.$resolve()

		expect(onunload).to.not.be.called
		expect(found).to.have.property("id", "a")
		expect(view).to.have.been.calledThrice
	})

	// https://github.com/lhorie/mithril.js/issues/551
	it("only redraws a component when clicked if the strategy is `none`", function () { // eslint-disable-line
		var root = mock.document.createElement("div")
		var a = false
		var found = {}

		var onunload = sinon.spy()
		var view = sinon.spy(function () {
			return m("div", {config: Comp.config}, [ // eslint-disable-line
				m("div", {
					onclick: function () {
						a = !a
						m.redraw(true)
						found = root.childNodes[0].childNodes[1]
						m.redraw.strategy("none")
					}
				}, "asd"),
				a ? m("#a", "aaa") : null,
				"test"
			])
		})

		var Comp = {
			view: view,

			config: function (el, init, ctx) {
				if (!init) ctx.onunload = onunload
			}
		}

		m.mount(root, pure(function () { return Comp }))

		var target = root.childNodes[0].childNodes[0]

		target.onclick({currentTarget: target})
		mock.requestAnimationFrame.$resolve()

		expect(onunload).to.not.be.called
		expect(found).to.have.property("id", "a")
		expect(view).to.have.been.calledTwice
	})

	it("redraws when clicked and click handler forces redraw", function () {
		var root = mock.document.createElement("div")
		var view = sinon.stub().returns(m("div", {
			onclick: function () { m.redraw(true) }
		}))

		m.mount(root, pure(view))

		var target = root.childNodes[0]

		target.onclick({currentTarget: target})
		mock.requestAnimationFrame.$resolve()

		expect(view).to.be.calledThrice
	})

	function resolveXhr() {
		mock.XMLHttpRequest.$instances.pop().$resolve().onreadystatechange()
		mock.requestAnimationFrame.$resolve()
	}

	it("doesn't redraw on a single synchronous request", function () {
		var root = mock.document.createElement("div")

		var data
		var view = sinon.spy(function (ctrl) {
			data = ctrl.foo()
			return m("div")
		})

		var Comp = {
			controller: function () {
				this.foo = m.request({method: "GET", url: "/foo"})
			},

			view: view
		}

		mount(root, pure(function () { return Comp }))

		resolveXhr()

		clear(root)

		expect(view).to.be.calledOnce
		expect(data).to.have.property("url", "/foo")
	})

	it("doesn't redraw on multiple synchronous requests", function () {
		mock.requestAnimationFrame.$resolve()
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var view1 = sinon.stub().returns(m("div"))
		var view2 = sinon.stub().returns(m("div"))

		var Comp1 = {
			controller: function () {
				this.foo = m.request({method: "GET", url: "/foo"})
			},
			view: view1
		}

		var Comp2 = {
			controller: function () {
				this.bar = m.request({method: "GET", url: "/bar"})
			},
			view: view2
		}

		mount(root, pure(function () {
			return m("div", [
				Comp1,
				Comp2
			])
		}))

		resolveXhr()
		resolveXhr()

		clear(root)

		expect(view1).to.be.calledOnce
		expect(view2).to.be.calledOnce
	})

	it("instantiates different controllers for components without controller constructors", function () { // eslint-disable-line
		var root = mock.document.createElement("div")

		var cond = true
		var controller1, controller2

		var Comp1 = pure(function (ctrl) {
			controller1 = ctrl
			return m("div")
		})

		var Comp2 = pure(function (ctrl) {
			controller2 = ctrl
			return m("div")
		})

		mount(root, pure(function () { return cond ? Comp1 : Comp2 }))

		cond = false
		refresh(true)

		expect(controller1).to.not.equal(controller2)
	})

	it("unloads removed components", function () {
		var root = mock.document.createElement("div")

		var onunload = sinon.spy()
		var cond = true

		var Comp1 = pure(function () {
			return m("div", {
				config: function (el, init, ctx) {
					ctx.onunload = onunload
				}
			})
		})

		var Comp2 = pure(function () { return m("div") })

		mount(root, pure(function () { return cond ? Comp1 : Comp2 }))

		cond = false
		refresh(true)

		expect(onunload).to.be.called
	})

	it("calls config with its second argument false first", function () {
		var root = mock.document.createElement("div")

		var cond = true
		var config = sinon.spy()

		var Comp1 = pure(function () { return m("div") })
		var Comp2 = pure(function () { return m("div", {config: config}) })

		mount(root, pure(function () { return cond ? Comp1 : Comp2 }))

		cond = false
		refresh(true)

		expect(config.firstCall.args[1]).to.be.false
	})

	it("refreshes the component when it's redrawn in a handler", function () {
		var root = mock.document.createElement("div")
		var sub = pure(function () { return m("#bar", "test") })
		var el

		m.mount(root, pure(function (ctrl) {
			return m("div", [
				m("button", {
					onclick: function () {
						ctrl.bar = true
						m.redraw(true)
						el = root.childNodes[0].childNodes[1]
					}
				}, "click me"),
				ctrl.bar ? m.component(sub) : ""
			])
		}))

		root.childNodes[0].childNodes[0].onclick({})

		expect(el).to.have.property("id", "bar")
	})
})
