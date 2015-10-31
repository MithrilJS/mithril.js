describe("m.route.buildQueryString()", function () {
	"use strict"

	it("exists", function () {
		expect(m.route.buildQueryString).to.be.a("function")
	})

	it("converts an empty object to an empty string", function () {
		expect(m.route.buildQueryString({})).to.equal("")
	})

	it("converts an object into a correct query string", function () {
		expect(
			m.route.buildQueryString({
				foo: "bar",
				hello: ["world", "mars", "mars"],
				world: {
					test: 3
				},
				bam: "",
				yup: null,
				removed: undefined
			})
		).to.equal("foo=bar&hello=world&hello=mars&world%5Btest%5D=3&bam=&yup")
	})
})
