describe("m.version()", function () {
	"use strict"

	it("exists", function () {
		expect(m.version).to.be.a("function")
	})

	it("is a string", function () {
		expect(m.version()).to.be.a("string")
	})
})

describe("m()", function () {
	"use strict"

	it("exists", function () {
		expect(m).to.be.a("function")
	})

	it("sets correct tag name", function () {
		expect(m("div")).to.have.property("tag", "div")
	})

	it("sets correct tag name with only a class", function () {
		expect(m(".foo")).to.have.property("tag", "div")
	})

	it("sets correct class name", function () {
		expect(m(".foo")).to.have.deep.property("attrs.className", "foo")
	})

	it("sets correct tag name with only an attr", function () {
		expect(m("[title=bar]")).to.have.property("tag", "div")
	})

	it("sets correct unquoted attr", function () {
		expect(m("[title=bar]")).to.have.deep.property("attrs.title", "bar")
	})

	it("sets attr without a value as an empty string", function () {
		expect(m("[empty]")).to.have.deep.property("attrs.empty", true)
	})

	it("sets correct single quoted attr", function () {
		expect(m("[title=\'bar\']")).to.have.deep.property("attrs.title", "bar")
	})

	it("sets correct double quoted attr", function () {
		expect(m("[title=\"bar\"]")).to.have.deep.property("attrs.title", "bar")
	})

	it("sets correct children with 1 string arg", function () {
		expect(m("div", "test"))
			.to.have.property("children")
			.that.eqls(["test"])
	})

	it("sets correct children with multiple string args", function () {
		expect(m("div", "test", "test2"))
			.to.have.property("children")
			.that.eqls(["test", "test2"])
	})

	it("sets correct children with string array", function () {
		expect(m("div", ["test"]))
			.to.have.property("children")
			.that.eqls(["test"])
	})

	it("sets correct attrs with object", function () {
		expect(m("div", {title: "bar"}, "test"))
			.to.have.deep.property("attrs.title", "bar")
	})

	it("sets correct children with attrs object", function () {
		expect(m("div", {title: "bar"}, "test"))
			.to.have.property("children")
			.that.eqls(["test"])
	})

	it("sets correct children with nested node", function () {
		expect(m("div", {title: "bar"}, m("div")))
			.to.have.property("children")
			.that.eqls([m("div")])
	})

	it("sets correct children with string rest arg", function () {
		expect(m("div", {title: "bar"}, "test0", "test1", "test2", "test3"))
			.to.have.property("children")
			.that.eqls(["test0", "test1", "test2", "test3"])
	})

	it("sets correct children with node rest arg", function () {
		expect(m("div", {title: "bar"}, m("div"), m("i"), m("span")))
			.to.have.property("children")
			.that.eqls([m("div"), m("i"), m("span")])
	})

	it("sets correct children with string array & no attrs", function () {
		expect(m("div", ["a", "b"]))
			.to.have.property("children")
			.that.eqls(["a", "b"])
	})

	it("sets correct children with node array & no attrs", function () {
		expect(m("div", [m("div"), m("i")]))
			.to.have.property("children")
			.that.eqls([m("div"), m("i")])
	})

	it("sets correct children with 2nd arg as node", function () {
		expect(m("div", m("div"))).to.have.property("children")
			.that.eqls([m("div")])
	})

	it("sets correct tag with undefined array entry", function () {
		expect(m("div", [undefined])).to.have.property("tag", "div")
	})

	it("loosely accepts invalid objects", function () {
		expect(function () { m("div", [{foo: "bar"}]) }).to.not.throw()
	})

	it("accepts svg nodes", function () {
		expect(m("svg", [m("g")]))
			.to.have.property("children")
			.that.eqls([m("g")])
	})

	it("accepts HTML children in svg element", function () {
		expect(m("svg", [m("a[href='http://google.com']")]))
			.to.have.property("children")
			.that.eqls([m("a[href='http://google.com']")])
	})

	it("uses className if given", function () {
		expect(m(".foo", {className: ""}))
			.to.have.deep.property("attrs.className", "foo")
	})

	it("accepts a class and class attr", function () {
		var node = m(".foo", {class: "bar"})
		expect(node).to.have.deep.property("attrs.class")
		expect(node.attrs.class).to.include("foo").and.include("bar")
	})

	it("accepts a class and className attr", function () {
		var node = m(".foo", {className: "bar"})
		expect(node).to.have.deep.property("attrs.className")
		expect(node.attrs.className).to.include("foo").and.include("bar")
	})

	// https://github.com/lhorie/mithril.js/issues/382 and 512
	it("sets an empty className attr if it's an empty string", function () {
		expect(m("div", {className: ""}))
			.to.have.deep.property("attrs.className", "")
	})

	it("does not set className attr if class is given", function () {
		expect(m("div", {class: ""})).to.not.have.property("attrs.className")
	})

	it("does not set class attr if className is given", function () {
		expect(m("div", {className: ""})).to.not.have.property("attrs.class")
	})

	it("sets an empty class attr if it's an empty string", function () {
		expect(m("div", {class: ""})).to.have.deep.property("attrs.class", "")
	})

	it("does not flatten 1 nested array", function () {
		expect(m("div", [1, 2, 3], 4))
			.to.have.property("children")
			.that.eqls([[1, 2, 3], 4])
	})

	it("does not flatten 2 nested arrays", function () {
		expect(m("div", [1, 2, 3], [4, 5, 6, 7]))
			.to.have.property("children")
			.that.eqls([[1, 2, 3], [4, 5, 6, 7]])
	})

	it("does not flatten 3 nested arrays", function () {
		expect(m("div", [1], [2], [3]))
			.to.have.property("children")
			.that.eqls([[1], [2], [3]])
	})

	it("doesn't recreate the DOM when classes are different", function () {
		var v1 = m(".foo", {class: "", onclick: function () {}})
		var v2 = m(".foo", {class: "bar", onclick: function () {}})

		expect(v1)
			.to.have.property("attrs")
			.that.contains.all.keys("class", "onclick")

		expect(v2)
			.to.have.property("attrs")
			.that.contains.all.keys("class", "onclick")
	})

	it("proxies an object first arg to m.component()", function () {
		var spy = sinon.spy()

		var component = {
			controller: spy,
			view: function () {
				return m("div", "testing")
			}
		}

		var args = {age: 12}

		m(component, args).controller()
		expect(spy.firstCall).to.have.been.calledWith(args)

		m.component(component, args).controller()
		expect(spy.secondCall).to.have.been.calledWith(args)
	})

	it("does not proxy to m.component() if the object does not have .view() method", function () {
		var component = {}

		var args = {age: 12}

		expect(m.bind(m, component, args)).to.throw()
	})
})
