"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("shouldUpdate", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})
	
	o("prevents update in element", function() {
		var shouldUpdate = function() {return false}
		var vnode = {tag: "div", attrs: {id: "a", shouldUpdate: shouldUpdate}}
		var updated = {tag: "div", attrs: {id: "b", shouldUpdate: shouldUpdate}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.attributes["id"].nodeValue).equals("a")
	})
	
	o("prevents update in text", function() {
		var shouldUpdate = function() {return false}
		var vnode = {tag: "#", attrs: {shouldUpdate: shouldUpdate}, children: "a"}
		var updated = {tag: "#", attrs: {shouldUpdate: shouldUpdate}, children: "b"}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.nodeValue).equals("a")
	})
	
	o("prevents update in html", function() {
		var shouldUpdate = function() {return false}
		var vnode = {tag: "<", attrs: {shouldUpdate: shouldUpdate}, children: "a"}
		var updated = {tag: "<", attrs: {shouldUpdate: shouldUpdate}, children: "b"}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.nodeValue).equals("a")
	})
	
	o("prevents update in fragment", function() {
		var shouldUpdate = function() {return false}
		var vnode = {tag: "[", attrs: {shouldUpdate: shouldUpdate}, children: [{tag: "#", children: "a"}]}
		var updated = {tag: "[", attrs: {shouldUpdate: shouldUpdate}, children: [{tag: "#", children: "b"}]}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.nodeValue).equals("a")
	})
	
	o("prevents update in component", function() {
		var component = {
			shouldUpdate: function() {return false},
			view: function(vnode) {
				return {tag: "div", children: vnode.children}
			},
		}
		var vnode = {tag: component, children: [{tag: "#", children: "a"}]}
		var updated = {tag: component, children: [{tag: "#", children: "b"}]}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.firstChild.nodeValue).equals("a")
	})
	
	o("prevents update if returning false in component and false in vnode", function() {
		var component = {
			shouldUpdate: function() {return false},
			view: function(vnode) {
				return {tag: "div", attrs: {id: vnode.attrs.id}}
			},
		}
		var vnode = {tag: component, attrs: {id: "a", shouldUpdate: function() {return false}}}
		var updated = {tag: component, attrs: {id: "b", shouldUpdate: function() {return false}}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.attributes["id"].nodeValue).equals("a")
	})
	
	o("does not prevent update if returning true in component and true in vnode", function() {
		var component = {
			shouldUpdate: function() {return true},
			view: function(vnode) {
				return {tag: "div", attrs: {id: vnode.attrs.id}}
			},
		}
		var vnode = {tag: component, attrs: {id: "a", shouldUpdate: function() {return true}}}
		var updated = {tag: component, attrs: {id: "b", shouldUpdate: function() {return true}}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})
	
	o("does not prevent update if returning false in component but true in vnode", function() {
		var component = {
			shouldUpdate: function() {return false},
			view: function(vnode) {
				return {tag: "div", attrs: {id: vnode.attrs.id}}
			},
		}
		var vnode = {tag: component, attrs: {id: "a", shouldUpdate: function() {return true}}}
		var updated = {tag: component, attrs: {id: "b", shouldUpdate: function() {return true}}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})
	
	o("does not prevent update if returning true in component but false in vnode", function() {
		var component = {
			shouldUpdate: function() {return true},
			view: function(vnode) {
				return {tag: "div", attrs: {id: vnode.attrs.id}}
			},
		}
		var vnode = {tag: component, attrs: {id: "a", shouldUpdate: function() {return false}}}
		var updated = {tag: component, attrs: {id: "b", shouldUpdate: function() {return false}}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})
	
	o("does not prevent update if returning true", function() {
		var shouldUpdate = function() {return true}
		var vnode = {tag: "div", attrs: {id: "a", shouldUpdate: shouldUpdate}}
		var updated = {tag: "div", attrs: {id: "b", shouldUpdate: shouldUpdate}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})
	
	o("does not prevent update if returning true from component", function() {
		var component = {
			shouldUpdate: function() {return true},
			view: function(vnode) {
				return {tag: "div", attrs: vnode.attrs}
			},
		}
		var vnode = {tag: component, attrs: {id: "a"}}
		var updated = {tag: component, attrs: {id: "b"}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})
	
	o("accepts arguments for comparison", function() {
		var count = 0
		var vnode = {tag: "div", attrs: {id: "a", shouldUpdate: shouldUpdate}}
		var updated = {tag: "div", attrs: {id: "b", shouldUpdate: shouldUpdate}}
		
		render(root, [vnode])
		render(root, [updated])
		
		function shouldUpdate(vnode, old) {
			count++
			
			o(old.attrs.id).equals("a")
			o(vnode.attrs.id).equals("b")
			
			return old.attrs.id !== vnode.attrs.id
		}
		
		o(count).equals(1)
		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})
	
	o("accepts arguments for comparison in component", function() {
		var component = {
			shouldUpdate: shouldUpdate,
			view: function(vnode) {
				return {tag: "div", attrs: vnode.attrs}
			},
		}
		var count = 0
		var vnode = {tag: component, attrs: {id: "a"}}
		var updated = {tag: component, attrs: {id: "b"}}
		
		render(root, [vnode])
		render(root, [updated])
		
		function shouldUpdate(vnode, old) {
			count++
			
			o(old.attrs.id).equals("a")
			o(vnode.attrs.id).equals("b")
			
			return old.attrs.id !== vnode.attrs.id
		}
		
		o(count).equals(1)
		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})
	
	o("is not called on creation", function() {
		var count = 0
		var vnode = {tag: "div", attrs: {id: "a", shouldUpdate: shouldUpdate}}
		var updated = {tag: "div", attrs: {id: "b", shouldUpdate: shouldUpdate}}
		
		render(root, [vnode])
		
		function shouldUpdate(vnode, old) {
			count++
			return true
		}
		
		o(count).equals(0)
	})
	
	o("is not called on component creation", function() {
		var component = {
			shouldUpdate: shouldUpdate,
			view: function(vnode) {
				return {tag: "div", attrs: vnode.attrs}
			},
		}
		
		var count = 0
		var vnode = {tag: "div", attrs: {id: "a"}}
		var updated = {tag: "div", attrs: {id: "b"}}
		
		render(root, [vnode])
		
		function shouldUpdate(vnode, old) {
			count++
			return true
		}
		
		o(count).equals(0)
	})
	
	o("is called only once on update", function() {
		var count = 0
		var vnode = {tag: "div", attrs: {id: "a", shouldUpdate: shouldUpdate}}
		var updated = {tag: "div", attrs: {id: "b", shouldUpdate: shouldUpdate}}
		
		render(root, [vnode])
		render(root, [updated])
		
		function shouldUpdate(vnode, old) {
			count++
			return true
		}
		
		o(count).equals(1)
	})
	
	o("is called only once on component update", function() {
		var component = {
			shouldUpdate: shouldUpdate,
			view: function(vnode) {
				return {tag: "div", attrs: vnode.attrs}
			},
		}
		
		var count = 0
		var vnode = {tag: component, attrs: {id: "a"}}
		var updated = {tag: component, attrs: {id: "b"}}
		
		render(root, [vnode])
		render(root, [updated])
		
		function shouldUpdate(vnode, old) {
			count++
			return true
		}
		
		o(count).equals(1)
	})
})