import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("render/hyperscript integration", function() {
	var G = setupGlobals()

	o.spec("setting class", function() {
		o("selector only", function() {
			m.render(G.root, m(".foo"))

			o(G.root.firstChild.className).equals("foo")
		})
		o("class only", function() {
			m.render(G.root, m("div", {class: "foo"}))

			o(G.root.firstChild.className).equals("foo")
		})
		o("className only", function() {
			m.render(G.root, m("div", {className: "foo"}))

			o(G.root.firstChild.className).equals("foo")
		})
		o("selector and class", function() {
			m.render(G.root, m(".bar", {class: "foo"}))

			o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar", "foo"])
		})
		o("selector and className", function() {
			m.render(G.root, m(".bar", {className: "foo"}))

			o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar", "foo"])
		})
		o("selector and a null class", function() {
			m.render(G.root, m(".foo", {class: null}))

			o(G.root.firstChild.className).equals("foo")
		})
		o("selector and a null className", function() {
			m.render(G.root, m(".foo", {className: null}))

			o(G.root.firstChild.className).equals("foo")
		})
		o("selector and an undefined class", function() {
			m.render(G.root, m(".foo", {class: undefined}))

			o(G.root.firstChild.className).equals("foo")
		})
		o("selector and an undefined className", function() {
			m.render(G.root, m(".foo", {className: undefined}))

			o(G.root.firstChild.className).equals("foo")
		})
	})
	o.spec("updating class", function() {
		o.spec("from selector only", function() {
			o("to selector only", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m(".foo1"))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from class only", function() {
			o("to selector only", function() {
				m.render(G.root, m("div", {class: "foo2"}))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m("div", {class: "foo2"}))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m("div", {class: "foo2"}))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m("div", {class: "foo2"}))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m("div", {class: "foo2"}))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m("div", {class: "foo2"}))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m("div", {class: "foo2"}))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m("div", {class: "foo2"}))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from ", function() {
			o("to selector only", function() {
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from className only", function() {
			o("to selector only", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m("div", {className: "foo1"}))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from selector and class", function() {
			o("to selector only", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m(".bar1", {class: "foo1"}))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from selector and className", function() {
			o("to selector only", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m(".bar1", {className: "foo1"}))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from  and a null class", function() {
			o("to selector only", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m(".foo1", {class: null}))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from selector and a null className", function() {
			o("to selector only", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m(".foo1", {className: null}))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from selector and an undefined class", function() {
			o("to selector only", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m(".foo1", {class: undefined}))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
		o.spec("from selector and an undefined className", function() {
			o("to selector only", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m(".foo2"))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to class only", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m("div", {class: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to className only", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m("div", {className: "foo2"}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and class", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m(".bar2", {class: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and className", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m(".bar2", {className: "foo2"}))

				o(G.root.firstChild.className.split(" ").sort()).deepEquals(["bar2", "foo2"])
			})
			o("to selector and a null class", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m(".foo2", {class: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and a null className", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m(".foo2", {className: null}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined class", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m(".foo2", {class: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
			o("to selector and an undefined className", function() {
				m.render(G.root, m(".foo1", {className: undefined}))
				m.render(G.root, m(".foo2", {className: undefined}))

				o(G.root.firstChild.className).equals("foo2")
			})
		})
	})
})
