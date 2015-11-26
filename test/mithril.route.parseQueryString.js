describe("m.route.parseQueryString()", function () {
	"use strict"

	it("exists", function () {
		expect(m.route.parseQueryString).to.be.a("function")
	})

	it("parses an empty string as an empty object", function () {
		var args = m.route.parseQueryString("")
		expect(args).to.eql({})
	})

	it("parses multiple parameters correctly", function () {
		var args = m.route.parseQueryString("foo=bar&hello=world&hello=mars" +
			"&bam=&yup")

		expect(args).to.eql({
			foo: "bar",
			hello: ["world", "mars"],
			bam: "",
			yup: null
		})
	})

	it("parses escapes correctly", function () {
		var args = m.route.parseQueryString("foo=bar&hello%5B%5D=world&" +
			"hello%5B%5D=mars&hello%5B%5D=pluto")

		expect(args).to.eql({
			foo: "bar",
			"hello[]": ["world", "mars", "pluto"]
		})
	})
})
