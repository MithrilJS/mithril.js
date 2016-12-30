describe("m.request()", function () {
	"use strict"

	// Much easier to read
	function resolve() {
		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.$resolve.apply(xhr, arguments)
		xhr.onreadystatechange()
		return xhr
	}

	// Common abstraction: request(opts, ...callbacks)
	function request(opts) {
		var ret = m.request(opts)
		for (var i = 0; i < arguments.length; i++) {
			ret = ret.then(arguments[i])
		}
		resolve()
		return ret
	}

	it("sets the correct properties on `GET`", function () {
		var prop = request({
			method: "GET",
			url: "test"
		})

		expect(prop()).to.contain.keys({
			method: "GET",
			url: "test"
		})
	})

	it("returns a Mithril promise (1)", function () {
		var prop = request(
			{method: "GET", url: "test"},
			function () { return "foo" })

		expect(prop()).to.equal("foo")
	})

	it("returns a Mithril promise (2)", function () {
		var prop = request({method: "GET", url: "test"})
		var result = prop()

		expect(prop.then(function (value) { return value })()).to.equal(result)
	})

	it("sets the correct properties on `POST`", function () {
		var prop = request({
			method: "POST",
			url: "http://domain.com:80",
			data: {}
		})

		expect(prop()).to.contain.keys({
			method: "POST",
			url: "http://domain.com:80"
		})
	})

	it("sets the correct arguments", function () {
		expect(request({
			method: "POST",
			url: "http://domain.com:80/:test1",
			data: {test1: "foo"}
		})().url).to.equal("http://domain.com:80/foo")
	})

	it("propagates errors through the promise (1)", function () {
		var error = m.prop()

		var prop = m.request({
			method: "GET",
			url: "test",
			deserialize: function () { throw new Error("error occurred") }
		}).then(null, error)
		resolve()

		expect(prop().message).to.equal("error occurred")
		expect(error().message).to.equal("error occurred")
	})

	it("propagates errors through the promise (2)", function () {
		var error = m.prop()

		var prop = m.request({
			method: "GET",
			url: "test",
			deserialize: function () { throw new Error("error occurred") }
		}).catch(error)
		resolve()

		expect(prop().message).to.equal("error occurred")
		expect(error().message).to.equal("error occurred")
	})

	it("synchronously throws TypeErrors", function () {
		var error = m.prop()
		var exception
		var prop = m.request({
			method: "GET",
			url: "test",
			deserialize: function () { throw new TypeError("error occurred") }
		}).then(null, error)

		try {
			resolve()
		} catch (e) {
			exception = e
		}

		expect(prop()).to.not.exist
		expect(error()).to.not.exist
		expect(exception.message).to.equal("error occurred")
	})

	it("sets correct Content-Type when given data", function () {
		var error = m.prop()

		m.request({
			method: "POST",
			url: "test",
			data: {foo: 1}
		}).then(null, error)

		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.onreadystatechange()

		expect(xhr.$headers).to.have.property(
			"Content-Type",
			"application/json; charset=utf-8")
	})

	it("doesn't set Content-Type when it doesn't have data", function () {
		var error = m.prop()

		m.request({
			method: "POST",
			url: "test"
		}).then(null, error)

		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.onreadystatechange()

		expect(xhr.$headers).to.not.have.property("Content-Type")
	})

	it("sets xhr request headers as per the headers config", function () {
		var error = m.prop()

		m.request({
			method: "POST",
			url: "test",
			headers: {
				"Authorization" : "Bearer 12345abcd12345",
				"CustomHeader" : "CustomValue"
			}
		}).then(null, error)

		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.onreadystatechange()

		expect(xhr.$headers).to.have.property(
			"Authorization",
			"Bearer 12345abcd12345")

		expect(xhr.$headers).to.have.property(
			"CustomHeader",
			"CustomValue")
	})

	it("overwrites existing headers", function () {
		var error = m.prop()

		m.request({
			method: "POST",
			url: "test",
			// Trigger the Content-Type addition
			data: {foo: "bar"},
			headers: {
				"Authorization" : "Bearer 12345abcd12345",
				"CustomHeader" : "CustomValue",
				"Content-Type" : "CustomType"
			}
		}).then(null, error)

		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.onreadystatechange()

		expect(xhr.$headers).to.have.property(
			"Authorization",
			"Bearer 12345abcd12345")

		expect(xhr.$headers).to.have.property(
			"CustomHeader",
			"CustomValue")

		expect(xhr.$headers).to.have.property(
			"Content-Type",
			"CustomType")
	})


	it("correctly sets initial value", function () {
		var prop = m.request({
			method: "POST",
			url: "test",
			initialValue: "foo"
		})

		var initialValue = prop()
		resolve()

		expect(initialValue).to.equal("foo")
	})

	it("correctly propagates initial value when not completed", function () {
		var prop = m.request({
			method: "POST",
			url: "test",
			initialValue: "foo"
		}).then(function (value) { return value })

		var initialValue = prop()
		resolve()

		expect(initialValue).to.equal("foo")
	})

	it("resolves `then` correctly with an initialValue", function () {
		var prop = m.request({
			method: "POST",
			url: "test",
			initialValue: "foo"
		}).then(function () { return "bar" })

		resolve()
		expect(prop()).to.equal("bar")
	})

	it("appends query strings to `url` from `data` for `GET`", function () {
		var prop = m.request({method: "GET", url: "/test", data: {foo: 1}})
		resolve()
		expect(prop().url).to.equal("/test?foo=1")
	})

	it("doesn't append query strings to `url` from `data` for `POST`", function () { // eslint-disable-line
		var prop = m.request({method: "POST", url: "/test", data: {foo: 1}})
		resolve()
		expect(prop().url).to.equal("/test")
	})

	it("ignores interpolations without data", function () { // eslint-disable-line
		var prop = m.request({method: "GET", url: "/test:notfound", data: {foo: 1}})
		resolve()
		expect(prop().url).to.equal("/test:notfound?foo=1")
	})

	it("appends children in query strings to `url` from `data` for `GET`", function () { // eslint-disable-line
		var prop = m.request({method: "GET", url: "test", data: {foo: [1, 2]}})
		resolve()
		expect(prop().url).to.equal("test?foo=1&foo=2")
	})

	it("propagates initial value in call before request is completed", function () { // eslint-disable-line
		var value
		var prop1 = m.request({method: "GET", url: "test", initialValue: 123})
		expect(prop1()).to.equal(123)
		var prop2 = prop1.then(function () { return 1 })
		expect(prop2()).to.equal(123)
		var prop3 = prop1.then(function (v) { value = v })
		expect(prop3()).to.equal(123)
		resolve()

		expect(value.method).to.equal("GET")
		expect(value.url).to.equal("test")
	})

	context("over jsonp", function () {
		/* eslint-disable no-invalid-this */
		beforeEach(function () {
			var body = this.body = mock.document.createElement("body")
			mock.document.body = body
			mock.document.appendChild(body)
		})

		afterEach(function () {
			mock.document.removeChild(this.body)
		})
		/* eslint-enable no-invalid-this */

		function request(data, callbackKey) {
			return m.request({
				url: "/test",
				dataType: "jsonp",
				data: data,
				callbackKey: callbackKey
			})
		}

		function find(list, item, prop) {
			var res
			for (var i = 0; i < list.length; i++) {
				var entry = list[i]
				if (prop != null) entry = entry[prop]
				if (entry.indexOf(item) >= 0) res = entry
			}
			return res
		}

		function resolve(data) {
			var callback = find(Object.keys(mock), "mithril_callback")
			var url = find(mock.document.getElementsByTagName("script"),
				callback, "src")
			mock[callback](data)
			return url
		}

		it("sets the `GET` url with the correct query parameters", function () {
			request({foo: "bar"})
			expect(resolve({foo: "bar"})).to.contain("foo=bar")
		})

		it("correctly gets the value, without appending the script on the document", function () { // eslint-disable-line
			var data = m.prop()

			request().then(data)

			var url = resolve({foo: "bar"})

			expect(url).to.contain("/test?callback=mithril_callback")
			expect(data()).to.eql({foo: "bar"})
		})

		it("correctly gets the value with a custom `callbackKey`, without appending the script on the document", function () { // eslint-disable-line
			var data = m.prop()

			request(null, "jsonpCallback").then(data)

			var url = resolve({foo: "bar1"})

			expect(url).to.contain("/test?jsonpCallback=mithril_callback")
			expect(data()).to.eql({foo: "bar1"})
		})

		it("correctly gets the value on calling the function", function () {
			var req = request()
			resolve({foo: "bar1"})
			expect(req()).to.eql({foo: "bar1"})
		})
	})

	it("ends the computation when a SyntaxError is thrown from `options.extract`", function () { // eslint-disable-line max-len
		var root = mock.document.createElement("div")
		var viewSpy = sinon.spy(function () { return m("div") })
		var resolved = sinon.spy()
		var rejected = sinon.spy()

		m.mount(root, {
			controller: function () {
				m.request({
					url: "/test",
					extract: function () {
						throw new SyntaxError()
					}
				}).then(resolved, rejected)
			},

			view: viewSpy
		})

		// For good measure
		mock.requestAnimationFrame.$resolve()

		expect(function () {
			resolve()
		}).to.throw()

		expect(resolved).to.not.have.been.called
		expect(rejected).to.not.have.been.called

		// The controller should throw, but the view should still render.
		expect(viewSpy).to.have.been.called

		// For good measure
		mock.requestAnimationFrame.$resolve()
	})

	it("can use a config correctly", function () {
		var config = sinon.spy()
		var result = m.prop()
		var error = sinon.spy
		var opts = {
			method: "GET",
			url: "/test",
			config: config
		}
		m.request(opts).then(result, error)
		var xhr = resolve({foo: "bar"})

		expect(config).to.be.calledWithExactly(xhr, opts)
		expect(result()).to.eql({foo: "bar"})
		expect(error).to.not.be.called
	})
})
