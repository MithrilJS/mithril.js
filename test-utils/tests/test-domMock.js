"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")

o.spec("domMock", function() {
	var $document
	o.beforeEach(function() {
		$document = domMock().document
		//$document = document //TODO clean up
	})
	
	o.spec("createElement", function() {
		o("works", function() {
			var node = $document.createElement("div")
			
			o(node.nodeType).equals(1)
			o(node.nodeName).equals("DIV")
			o(node.namespaceURI).equals("http://www.w3.org/1999/xhtml")
			o(node.parentNode).equals(null)
			o(node.childNodes.length).equals(0)
			o(node.firstChild).equals(null)
			o(node.nextSibling).equals(null)
		})
	})
	
	o.spec("createElementNS", function() {
		o("works", function() {
			var node = $document.createElementNS("http://www.w3.org/2000/svg", "svg")
			
			o(node.nodeType).equals(1)
			o(node.nodeName).equals("svg")
			o(node.namespaceURI).equals("http://www.w3.org/2000/svg")
			o(node.parentNode).equals(null)
			o(node.childNodes.length).equals(0)
			o(node.firstChild).equals(null)
			o(node.nextSibling).equals(null)
		})
	})
	
	o.spec("createTextNode", function() {
		o("works", function() {
			var node = $document.createTextNode("abc")
			
			o(node.nodeType).equals(3)
			o(node.nodeName).equals("#text")
			o(node.parentNode).equals(null)
			o(node.nodeValue).equals("abc")
		})
		o("works w/ number", function() {
			var node = $document.createTextNode(123)
			
			o(node.nodeValue).equals("123")
		})
		o("works w/ null", function() {
			var node = $document.createTextNode(null)
			
			o(node.nodeValue).equals("null")
		})
		o("works w/ undefined", function() {
			var node = $document.createTextNode(undefined)
			
			o(node.nodeValue).equals("undefined")
		})
		o("works w/ object", function() {
			var node = $document.createTextNode({})
			
			o(node.nodeValue).equals("[object Object]")
		})
		o("does not unescape HTML", function() {
			var node = $document.createTextNode("<a>&amp;</a>")
			
			o(node.nodeValue).equals("<a>&amp;</a>")
		})
		o("nodeValue casts to string", function() {
			var node = $document.createTextNode("a")
			node.nodeValue = true
			
			o(node.nodeValue).equals("true")
		})
	})
	
	o.spec("createDocumentFragment", function() {
		o("works", function() {
			var node = $document.createDocumentFragment()
			
			o(node.nodeType).equals(11)
			o(node.nodeName).equals("#document-fragment")
			o(node.parentNode).equals(null)
			o(node.childNodes.length).equals(0)
			o(node.firstChild).equals(null)
		})
	})
	
	o.spec("appendChild", function() {
		o("works", function() {
			var parent = $document.createElement("div")
			var child = $document.createElement("a")
			parent.appendChild(child)
			
			o(parent.childNodes.length).equals(1)
			o(parent.childNodes[0]).equals(child)
			o(parent.firstChild).equals(child)
			o(child.parentNode).equals(parent)
		})
		o("moves existing", function() {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			var b = $document.createElement("b")
			parent.appendChild(a)
			parent.appendChild(b)
			parent.appendChild(a)
			
			o(parent.childNodes.length).equals(2)
			o(parent.childNodes[0]).equals(b)
			o(parent.childNodes[1]).equals(a)
			o(parent.firstChild).equals(b)
			o(parent.firstChild.nextSibling).equals(a)
			o(a.parentNode).equals(parent)
			o(b.parentNode).equals(parent)
		})
		o("removes from old parent", function() {
			var parent = $document.createElement("div")
			var source = $document.createElement("span")
			var a = $document.createElement("a")
			var b = $document.createElement("b")
			parent.appendChild(a)
			source.appendChild(b)
			parent.appendChild(b)
			
			o(source.childNodes.length).equals(0)
		})
		o("transfers from fragment", function() {
			var parent = $document.createElement("div")
			var a = $document.createDocumentFragment("a")
			var b = $document.createElement("b")
			var c = $document.createElement("c")
			a.appendChild(b)
			a.appendChild(c)
			parent.appendChild(a)
			
			o(parent.childNodes.length).equals(2)
			o(parent.childNodes[0]).equals(b)
			o(parent.childNodes[1]).equals(c)
			o(parent.firstChild).equals(b)
			o(parent.firstChild.nextSibling).equals(c)
			o(a.childNodes.length).equals(0)
			o(a.firstChild).equals(null)
			o(a.parentNode).equals(null)
			o(b.parentNode).equals(parent)
			o(c.parentNode).equals(parent)
		})
		o("throws if appended to self", function(done) {
			var div = $document.createElement("div")
			try {div.appendChild(div)}
			catch (e) {done()}
		})
		o("throws if appended to child", function(done) {
			var parent = $document.createElement("div")
			var child = $document.createElement("a")
			parent.appendChild(child)
			try {child.appendChild(parent)}
			catch (e) {done()}
		})
		o("throws if child is not element", function(done) {
			var parent = $document.createElement("div")
			var child = 1
			try {parent.appendChild(child)}
			catch (e) {done()}
		})
	})
	
	o.spec("removeChild", function() {
		o("works", function() {
			var parent = $document.createElement("div")
			var child = $document.createElement("a")
			parent.appendChild(child)
			parent.removeChild(child)
			
			o(parent.childNodes.length).equals(0)
			o(parent.firstChild).equals(null)
			o(child.parentNode).equals(null)
		})
		o("throws if not a child", function(done) {
			var parent = $document.createElement("div")
			var child = $document.createElement("a")
			try {parent.removeChild(child)}
			catch (e) {done()}
		})
	})
	
	o.spec("insertBefore", function() {
		o("works", function() {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			var b = $document.createElement("b")
			parent.appendChild(a)
			parent.insertBefore(b, a)
			
			o(parent.childNodes.length).equals(2)
			o(parent.childNodes[0]).equals(b)
			o(parent.childNodes[1]).equals(a)
			o(parent.firstChild).equals(b)
			o(parent.firstChild.nextSibling).equals(a)
			o(a.parentNode).equals(parent)
			o(b.parentNode).equals(parent)
		})
		o("moves existing", function() {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			var b = $document.createElement("b")
			parent.appendChild(a)
			parent.appendChild(b)
			parent.insertBefore(b, a)
			
			o(parent.childNodes.length).equals(2)
			o(parent.childNodes[0]).equals(b)
			o(parent.childNodes[1]).equals(a)
			o(parent.firstChild).equals(b)
			o(parent.firstChild.nextSibling).equals(a)
			o(a.parentNode).equals(parent)
			o(b.parentNode).equals(parent)
		})
		o("removes from old parent", function() {
			var parent = $document.createElement("div")
			var source = $document.createElement("span")
			var a = $document.createElement("a")
			var b = $document.createElement("b")
			parent.appendChild(a)
			source.appendChild(b)
			parent.insertBefore(b, a)
			
			o(source.childNodes.length).equals(0)
		})
		o("transfers from fragment", function() {
			var parent = $document.createElement("div")
			var ref = $document.createElement("span")
			var a = $document.createDocumentFragment("a")
			var b = $document.createElement("b")
			var c = $document.createElement("c")
			parent.appendChild(ref)
			a.appendChild(b)
			a.appendChild(c)
			parent.insertBefore(a, ref)
			
			o(parent.childNodes.length).equals(3)
			o(parent.childNodes[0]).equals(b)
			o(parent.childNodes[1]).equals(c)
			o(parent.childNodes[2]).equals(ref)
			o(parent.firstChild).equals(b)
			o(parent.firstChild.nextSibling).equals(c)
			o(parent.firstChild.nextSibling.nextSibling).equals(ref)
			o(a.childNodes.length).equals(0)
			o(a.firstChild).equals(null)
			o(a.parentNode).equals(null)
			o(b.parentNode).equals(parent)
			o(c.parentNode).equals(parent)
		})
		o("appends if second arg is null", function() {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			var b = $document.createElement("b")
			parent.appendChild(a)
			parent.insertBefore(b, null)
			
			o(parent.childNodes.length).equals(2)
			o(parent.childNodes[0]).equals(a)
			o(parent.childNodes[1]).equals(b)
			o(parent.firstChild).equals(a)
			o(parent.firstChild.nextSibling).equals(b)
			o(a.parentNode).equals(parent)
		})
		o("throws if appended to self", function(done) {
			var div = $document.createElement("div")
			var a = $document.createElement("a")
			div.appendChild(a)
			try {div.isnertBefore(div, a)}
			catch (e) {done()}
		})
		o("throws if appended to child", function(done) {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			var b = $document.createElement("b")
			parent.appendChild(a)
			a.appendChild(b)
			try {a.insertBefore(parent, b)}
			catch (e) {done()}
		})
		o("throws if child is not element", function(done) {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			parent.appendChild(a)
			try {parent.insertBefore(1, a)}
			catch (e) {done()}
		})
		o("throws if inserted before itself", function(done) {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			try {parent.insertBefore(a, a)}
			catch (e) {done()}
		})
		o("throws if second arg is undefined", function(done) {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			try {parent.insertBefore(a)}
			catch (e) {done()}
		})
		o("throws if reference is not child", function(done) {
			var parent = $document.createElement("div")
			var a = $document.createElement("a")
			var b = $document.createElement("b")
			try {parent.insertBefore(a, b)}
			catch (e) {done()}
		})
	})
	
	o.spec("setAttribute", function() {
		o("works", function() {
			var div = $document.createElement("div")
			div.setAttribute("id", "aaa")
			
			o(div.attributes["id"].nodeValue).equals("aaa")
			o(div.attributes["id"].namespaceURI).equals(null)
		})
		o("works w/ number", function() {
			var div = $document.createElement("div")
			div.setAttribute("id", 123)
			
			o(div.attributes["id"].nodeValue).equals("123")
		})
		o("works w/ null", function() {
			var div = $document.createElement("div")
			div.setAttribute("id", null)
			
			o(div.attributes["id"].nodeValue).equals("null")
		})
		o("works w/ undefined", function() {
			var div = $document.createElement("div")
			div.setAttribute("id", undefined)
			
			o(div.attributes["id"].nodeValue).equals("undefined")
		})
		o("works w/ object", function() {
			var div = $document.createElement("div")
			div.setAttribute("id", {})
			
			o(div.attributes["id"].nodeValue).equals("[object Object]")
		})
	})
	
	o.spec("setAttributeNS", function() {
		o("works", function() {
			var div = $document.createElement("div")
			div.setAttributeNS("http://www.w3.org/1999/xlink", "href", "aaa")
			
			o(div.attributes["href"].nodeValue).equals("aaa")
			o(div.attributes["href"].namespaceURI).equals("http://www.w3.org/1999/xlink")
		})
		o("works w/ number", function() {
			var div = $document.createElement("div")
			div.setAttributeNS("http://www.w3.org/1999/xlink", "href", 123)
			
			o(div.attributes["href"].nodeValue).equals("123")
			o(div.attributes["href"].namespaceURI).equals("http://www.w3.org/1999/xlink")
		})
	})
	
	o.spec("removeAttribute", function() {
		o("works", function() {
			var div = $document.createElement("div")
			div.setAttribute("id", "aaa")
			div.removeAttribute("id")
			
			o("id" in div.attributes).equals(false)
		})
	})
	
	o.spec("textContent", function() {
		o("works", function() {
			var div = $document.createElement("div")
			var a = $document.createElement("a")
			div.textContent = "aaa"
			
			o(div.childNodes.length).equals(1)
			o(div.firstChild.nodeType).equals(3)
			o(div.firstChild.nodeValue).equals("aaa")
		})
		o("works with empty string", function() {
			var div = $document.createElement("div")
			var a = $document.createElement("a")
			div.textContent = ""
			
			o(div.childNodes.length).equals(0)
		})
	})
	
	o.spec("innerHTML", function() {
		o("works", function() {
			var div = $document.createElement("div")
			div.innerHTML = "<br /><a class='aaa' id='xyz'>123<b class=\"bbb\"></b>234<br class=ccc>345</a>"
			o(div.childNodes.length).equals(2)
			o(div.childNodes[0].nodeType).equals(1)
			o(div.childNodes[0].nodeName).equals("BR")
			o(div.childNodes[1].nodeType).equals(1)
			o(div.childNodes[1].nodeName).equals("A")
			o(div.childNodes[1].attributes["class"].nodeValue).equals("aaa")
			o(div.childNodes[1].attributes["id"].nodeValue).equals("xyz")
			o(div.childNodes[1].childNodes[0].nodeType).equals(3)
			o(div.childNodes[1].childNodes[0].nodeValue).equals("123")
			o(div.childNodes[1].childNodes[1].nodeType).equals(1)
			o(div.childNodes[1].childNodes[1].nodeName).equals("B")
			o(div.childNodes[1].childNodes[1].attributes["class"].nodeValue).equals("bbb")
			o(div.childNodes[1].childNodes[2].nodeType).equals(3)
			o(div.childNodes[1].childNodes[2].nodeValue).equals("234")
			o(div.childNodes[1].childNodes[3].nodeType).equals(1)
			o(div.childNodes[1].childNodes[3].nodeName).equals("BR")
			o(div.childNodes[1].childNodes[3].attributes["class"].nodeValue).equals("ccc")
			o(div.childNodes[1].childNodes[4].nodeType).equals(3)
			o(div.childNodes[1].childNodes[4].nodeValue).equals("345")
		})
		o("headers work", function() {
			var div = $document.createElement("div")
			div.innerHTML = "<h1></h1><h2></h2><h3></h3><h4></h4><h5></h5><h6></h6>"
			o(div.childNodes.length).equals(6)
			o(div.childNodes[0].nodeType).equals(1)
			o(div.childNodes[0].nodeName).equals("H1")
			o(div.childNodes[1].nodeType).equals(1)
			o(div.childNodes[1].nodeName).equals("H2")
			o(div.childNodes[2].nodeType).equals(1)
			o(div.childNodes[2].nodeName).equals("H3")
			o(div.childNodes[3].nodeType).equals(1)
			o(div.childNodes[3].nodeName).equals("H4")
			o(div.childNodes[4].nodeType).equals(1)
			o(div.childNodes[4].nodeName).equals("H5")
			o(div.childNodes[5].nodeType).equals(1)
			o(div.childNodes[5].nodeName).equals("H6")
		})
		o("detaches old elements", function() {
			var div = $document.createElement("div")
			var a = $document.createElement("a")
			div.appendChild(a)
			div.innerHTML = "<b></b>"
			
			o(a.parentNode).equals(null)
		})
	})
	o.spec("focus", function() {
		o("body is active by default", function() {
			o($document.documentElement.nodeName).equals("HTML")
			o($document.body.nodeName).equals("BODY")
			o($document.documentElement.firstChild.nodeName).equals("HEAD")
			o($document.documentElement).equals($document.body.parentNode)
			o($document.activeElement).equals($document.body)
		})
		o("focus changes activeElement", function() {
			var input = $document.createElement("input")
			$document.body.appendChild(input)
			input.focus()
			
			o($document.activeElement).equals(input)
			
			$document.body.removeChild(input)
		})
	})
	o.spec("style", function() {
		o("has style property", function() {
			var div = $document.createElement("div")
			
			o(typeof div.style).equals("object")
		})
		o("setting style string works", function() {
			var div = $document.createElement("div")
			div.style = "background-color: red; border-bottom: 1px solid red;"
			
			o(div.style.backgroundColor).equals("red")
			o(div.style.borderBottom).equals("1px solid red")
		})
		o("removing via setting style string works", function() {
			var div = $document.createElement("div")
			div.style = "background: red;"
			div.style = ""
			
			o(div.style.background).equals("")
		})
	})
	o.spec("events", function() {
		o.spec("click", function() {
			var spy, div, e
			o.beforeEach(function() {
				spy = o.spy()
				div = $document.createElement("div")
				e = $document.createEvent("MouseEvents")
				e.initEvent("click", true, true)
				
				$document.body.appendChild(div)
			})
			o.afterEach(function() {
				$document.body.removeChild(div)
			})
			
			o("addEventListener works", function() {
				div.addEventListener("click", spy, false)
				div.dispatchEvent(e)
				
				o(spy.callCount).equals(1)
				o(spy.this).equals(div)
				o(spy.args[0].type).equals("click")
				o(spy.args[0].target).equals(div)
			})
			o("removeEventListener works", function(done) {
				div.addEventListener("click", spy, false)
				div.removeEventListener("click", spy, false)
				div.dispatchEvent(e)
				
				o(spy.callCount).equals(0)
				done()
			})
			o("click fires onclick", function() {
				div.onclick = spy
				div.dispatchEvent(e)
				
				o(spy.callCount).equals(1)
				o(spy.this).equals(div)
				o(spy.args[0].type).equals("click")
				o(spy.args[0].target).equals(div)
			})
			o("click without onclick doesn't throw", function(done) {
				div.dispatchEvent(e)
				done()
			})
		})
		o.spec("transitionend", function() {
			var spy, div, e
			o.beforeEach(function() {
				spy = o.spy()
				div = $document.createElement("div")
				e = $document.createEvent("AnimationEvent")
				e.initEvent("transitionend", true, true)
				
				$document.body.appendChild(div)
			})
			o.afterEach(function() {
				$document.body.removeChild(div)
			})
			
			o("ontransitionend does not fire", function(done) {
				div.ontransitionend = spy
				div.dispatchEvent(e)
				
				o(spy.callCount).equals(0)
				done()
			})
		})
	})
	o.spec("attributes", function() {
		o.spec("link href", function() {
			o("is empty string if no attribute", function() {
				var a = $document.createElement("a")
				
				o(a.href).equals("")
				o(a.attributes["href"]).equals(undefined)
			})
			o("is path if attribute is set", function() {
				var a = $document.createElement("a")
				a.setAttribute("href", "")
				
				o(a.href).notEquals("")
				o(a.attributes["href"].nodeValue).equals("")
			})
			o("is path if property is set", function() {
				var a = $document.createElement("a")
				a.href = ""
				
				o(a.href).notEquals("")
				o(a.attributes["href"].nodeValue).equals("")
			})
		})
		o.spec("input checked", function() {
			o("only exists in input elements", function() {
				var input = $document.createElement("input")
				var a = $document.createElement("a")
				
				o("checked" in input).equals(true)
				o("checked" in a).equals(false)
			})
			o("tracks attribute value when unset", function() {
				var input = $document.createElement("input")
				input.setAttribute("type", "checkbox")
				
				o(input.checked).equals(false)
				o(input.attributes["checked"]).equals(undefined)
				
				input.setAttribute("checked", "")
				
				o(input.checked).equals(true)
				o(input.attributes["checked"].nodeValue).equals("")
				
				input.removeAttribute("checked")
				
				o(input.checked).equals(false)
				o(input.attributes["checked"]).equals(undefined)
			})
			o("does not track attribute value when set", function() {
				var input = $document.createElement("input")
				input.setAttribute("type", "checkbox")
				input.checked = true
				
				o(input.checked).equals(true)
				o(input.attributes["checked"]).equals(undefined)
				
				input.checked = false
				input.setAttribute("checked", "")
				
				input.checked = true
				input.removeAttribute("checked")
				
				o(input.checked).equals(true)
			})
		})
	})
})
