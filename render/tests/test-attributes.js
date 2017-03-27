"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("attributes", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.body
		render = vdom($window).render
	})
	o.spec("customElements", function(){

		o("when vnode is customElement, custom setAttribute called", function(){

			var normal = [
				{tag: "input", attrs: {value: "hello"}},
				{tag: "input", attrs: {value: "hello"}},
				{tag: "input", attrs: {value: "hello"}}
			]

			var custom = [
				{tag: "custom-element", attrs: {custom: "x"}},
				{tag: "input", attrs: {is: "something-special", custom: "x"}},
				{tag: "custom-element", attrs: {is: "something-special", custom: "x"}}
			]

			var view = normal.concat(custom)

			var f = $window.document.createElement
			var spy

			$window.document.createElement = function(tag, is){
				var el = f(tag, is)
				if(!spy){
					spy = o.spy(el.setAttribute)
				}
				el.setAttribute = spy

				return el
			}

			render(root, view)

			o(spy.callCount).equals(custom.length)
		})

	})
	o.spec("input readonly", function() {
		o("when input readonly is true, attribute is present", function() {
			var a = {tag: "input", attrs: {readonly: true}}

			render(root, [a])

			o(a.dom.attributes["readonly"].nodeValue).equals("")
		})
		o("when input readonly is false, attribute is not present", function() {
			var a = {tag: "input", attrs: {readonly: false}}

			render(root, [a])

			o(a.dom.attributes["readonly"]).equals(undefined)
		})
	})
	o.spec("input checked", function() {
		o("when input checked is true, attribute is not present", function() {
			var a = {tag: "input", attrs: {checked: true}}

			render(root, [a])

			o(a.dom.checked).equals(true)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
		o("when input checked is false, attribute is not present", function() {
			var a = {tag: "input", attrs: {checked: false}}

			render(root, [a])

			o(a.dom.checked).equals(false)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
		o("after input checked is changed by 3rd party, it can still be changed by render", function() {
			var a = {tag: "input", attrs: {checked: false}}
			var b = {tag: "input", attrs: {checked: true}}

			render(root, [a])

			a.dom.checked = true //setting the javascript property makes the value no longer track the state of the attribute
			a.dom.checked = false

			render(root, [b])

			o(a.dom.checked).equals(true)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
	})
	o.spec("link href", function() {
		o("when link href is true, attribute is present", function() {
			var a = {tag: "a", attrs: {href: true}}

			render(root, [a])

			o(a.dom.attributes["href"]).notEquals(undefined)
		})
		o("when link href is false, attribute is not present", function() {
			var a = {tag: "a", attrs: {href: false}}

			render(root, [a])

			o(a.dom.attributes["href"]).equals(undefined)
		})
	})
	o.spec("canvas width and height", function() {
		o("uses attribute API", function() {
			var canvas = {tag: "canvas", attrs: {width: "100%"}}

			render(root, canvas)

			o(canvas.dom.attributes["width"].nodeValue).equals("100%")
			o(canvas.dom.width).equals(100)
		})
	})
	o.spec("svg class", function() {
		o("when className is specified then it should be added as a class", function() {
			var a = {tag: "svg", attrs: {className: "test"}}

			render(root, [a]);

			o(a.dom.attributes["class"].nodeValue).equals("test")
		})
	})
	o.spec("contenteditable throws on untrusted children", function() {
		o("including text nodes", function() {
			var div = {tag: "div", attrs: {contenteditable: true}, text: ""}
			var succeeded = false

			try {
				render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(false)
		})
		o("including elements", function() {
			var div = {tag: "div", attrs: {contenteditable: true}, children: [{tag: "script", attrs: {src: "http://evil.com"}}]}
			var succeeded = false

			try {
				render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(false)
		})
		o("tolerating empty children", function() {
			var div = {tag: "div", attrs: {contenteditable: true}, children: []}
			var succeeded = false

			try {
				render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(true)
		})
		o("tolerating trusted content", function() {
			var div = {tag: "div", attrs: {contenteditable: true}, children: [{tag: "<", children: "<a></a>"}]}
			var succeeded = false

			try {
				render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(true)
		})
	})
})
