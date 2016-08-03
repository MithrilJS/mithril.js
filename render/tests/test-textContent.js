"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var t = require("../../test-utils/hyperscript").t
var vdom = require("../../render/render")

o.spec("textContent", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("ignores null", function() {
		var vnodes = [t("a", undefined, null)]

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(0)
		o(vnodes[0].dom).equals(root.childNodes[0])
	})
	o("ignores undefined", function() {
		var vnodes = [t("a", undefined, undefined)]

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(0)
		o(vnodes[0].dom).equals(root.childNodes[0])
	})
	o("creates string", function() {
		var vnodes = [t("a", "a")]

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("a")
		o(vnodes[0].dom).equals(root.childNodes[0])
	})
	o("creates falsy string", function() {
		var vnodes = [t("a", "")]

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("")
		o(vnodes[0].dom).equals(root.childNodes[0])
	})
	o("creates number", function() {
		var vnodes = [t("a", 1)]

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("1")
		o(vnodes[0].dom).equals(root.childNodes[0])
	})
	o("creates falsy number", function() {
		var vnodes = [t("a", 0)]

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("0")
		o(vnodes[0].dom).equals(root.childNodes[0])
	})
	o("creates boolean", function() {
		var vnodes = [t("a", true)]

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("true")
		o(vnodes[0].dom).equals(root.childNodes[0])
	})
	o("creates falsy boolean", function() {
		var vnodes = [t("a", false)]

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("false")
		o(vnodes[0].dom).equals(root.childNodes[0])
	})
	o("updates to string", function() {
		var vnodes = [t("a", "a")]
		var updated = [t("a", "b")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("b")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("updates to falsy string", function() {
		var vnodes = [t("a", "a")]
		var updated = [t("a", "")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("updates to number", function() {
		var vnodes = [t("a", "a")]
		var updated = [t("a", 1)]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("1")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("updates to falsy number", function() {
		var vnodes = [t("a", "a")]
		var updated = [t("a", 0)]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("0")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("updates to boolean", function() {
		var vnodes = [t("a", "a")]
		var updated = [t("a", true)]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("true")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("updates to falsy boolean", function() {
		var vnodes = [t("a", "a")]
		var updated = [t("a", false)]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("false")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("updates with typecasting", function() {
		var vnodes = [t("a", "1")]
		var updated = [t("a", 1)]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("1")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("updates from without text to with text", function() {
		var vnodes = [t("a")]
		var updated = [t("a", "b")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes[0].nodeValue).equals("b")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("updates from with text to without text", function() {
		var vnodes = [t("a", "a")]
		var updated = [t("a")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom.childNodes.length).equals(0)
		o(updated[0].dom).equals(root.childNodes[0])
	})
})
