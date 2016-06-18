"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("createHTML", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("creates HTML", function() {
		var vnode = {tag: "<", children: "<a></a>"}
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("A")
	})
	o("creates text HTML", function() {
		var vnode = {tag: "<", children: "a"}
		render(root, [vnode])

		o(vnode.dom.nodeValue).equals("a")
	})
	o("handles empty HTML", function() {
		var vnode = {tag: "<", children: ""}
		render(root, [vnode])

		o(vnode.dom).equals(null)
		o(vnode.domSize).equals(0)
	})
	o("handles multiple children", function() {
		var vnode = {tag: "<", children: "<a></a><b></b>"}
		render(root, [vnode])

		o(vnode.domSize).equals(2)
		o(vnode.dom.nodeName).equals("A")
		o(vnode.dom.nextSibling.nodeName).equals("B")
	})
	o("handles valid html tags", function() {
		//FIXME body,head,html,frame,frameset are not supported
		//FIXME keygen is broken in Firefox
		var tags = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "big", "blockquote", /*"body",*/ "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", /*"frame", "frameset",*/ "h1", "h2", "h3", "h4", "h5", "h6", /*"head",*/ "header", "hr", /*"html",*/ "i", "iframe", "img", "input", "ins", "kbd", /*"keygen", */"label", "legend", "li", "link", "main", "map", "mark", "menu", "menuitem", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]

		tags.forEach(function(tag) {
			var vnode = {tag: "<", children: "<" + tag + " />"}
			render(root, [vnode])

			o(vnode.dom.nodeName).equals(tag.toUpperCase())
		})
	})
})
