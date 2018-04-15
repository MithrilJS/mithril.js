"use strict"
var o = require("../../ospec/ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("reuse", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})
	o("defaults to false in keyed mode", function() {
		var vnode = {tag: "a", key: "b"}
		render(root, [vnode])
		render(root, [])

		o(vnode.reuse).equals(false)
	})
	o("defaults to true in non-keyed mode", function() {
		var vnode = {tag: "a"}
		render(root, [vnode])
		render(root, [])

		o(vnode.reuse).equals(true)
	})
	o("the original value is preserved in keyed mode", function() {
		var vnode = {tag: "a", key: "b", reuse: true}
		var other= {tag: "a", key: "c", reuse: false}
		render(root, [vnode, other])
		render(root, [])

		o(vnode.reuse).equals(true)
		o(other.reuse).equals(false)
	})
	o("the original value is preserved in non-keyed mode", function() {
		var vnode = {tag: "a", reuse: true}
		var other= {tag: "a", reuse: false}
		render(root, [vnode, other])
		render(root, [])

		o(vnode.reuse).equals(true)
		o(other.reuse).equals(false)
	})
	o("always set to false for fragments on first render", function() {
		var vnode = {tag: "[", reuse: true, children: [{tag: "a"}]}
		render(root, [vnode])

		o(vnode.reuse).equals(false)
	})
	o("always set to false for empty fragments on first render", function() {
		var vnode = {tag: "[", reuse: true, children: []}
		render(root, [vnode])

		o(vnode.reuse).equals(false)
	})
	o("always set to false for fragments with null children on first render", function() {
		var vnode = {tag: "[", reuse: true}
		render(root, [vnode])

		o(vnode.reuse).equals(false)
	})
	o("always set to false for trusted strings on first render", function() {
		var vnode = {tag: "<", reuse: true, children: "<a>a</a><b>b</b>"}
		render(root, [vnode])

		o(vnode.reuse).equals(false)
	})
	o("always set to false for trusted empty strings on first render", function() {
		var vnode = {tag: "<", reuse: true, children: ""}
		render(root, [vnode])

		o(vnode.reuse).equals(false)
	})
	o.spec("hooks that access the DOM set it to false", function() {
		function addSpies(target, keys) {
			keys.forEach(function(k) {
				target[k] = o.spy(function(vnode) {o(vnode.reuse).equals(false)})
			})
		}
		o("oninit on the attrs doesn't prevent reuse", function() {
			var attrs = {oninit: o.spy(function(vnode) {o(vnode.reuse).equals(true)})}
			render(root, [{tag: "[", reuse: false, children: [{tag: "a", attrs: attrs}]}])
			render(root, [])

			o(attrs.oninit.callCount).equals(1)
		})
		o("oncreate on the attrs", function() {
			var attrs = {}
			addSpies(attrs, ["oncreate"])
			render(root, [{tag: "[", reuse: false, children: [{tag: "a", attrs: attrs}]}])
			render(root, [])

			o(attrs.oncreate.callCount).equals(1)
		})
		o("onbeforeupdate on the attrs", function() {
			var attrs = {}
			addSpies(attrs, ["onbeforeupdate"])
			render(root, [{tag: "[", reuse: false, children: [{tag: "a"}]}])
			render(root, [{tag: "[", reuse: false, children: [{tag: "a", attrs: attrs}]}])
			render(root, [])

			o(attrs.onbeforeupdate.callCount).equals(1)
		})
		o("onupdate on the attrs", function() {
			var attrs = {}
			addSpies(attrs, ["onupdate"])
			render(root, [{tag: "[", reuse: false, children: [{tag: "a"}]}])
			render(root, [{tag: "[", reuse: false, children: [{tag: "a", attrs: attrs}]}])
			render(root, [])

			o(attrs.onupdate.callCount).equals(1)
		})
		o("onbeforeremove on the attrs", function() {
			var attrs = {}
			addSpies(attrs, ["onbeforeremove"])
			render(root, [{tag: "a", attrs: attrs}])
			render(root, [])

			o(attrs.onbeforeremove.callCount).equals(1)
		})
		o("onremove on the attrs", function() {
			var attrs = {}
			addSpies(attrs, ["onremove"])
			render(root, [{tag: "[", reuse: true, children: [{tag: "a", attrs: attrs}]}])
			render(root, [])

			o(attrs.onremove.callCount).equals(1)
		})
	})
	o.spec("is not affected by hooks that don't fire", function() {
		var spy
		o.beforeEach(function() {
			spy = o.spy()
		})
		o("*create", function() {
			var vnode = {tag: "a", reuse: true, attrs: {oninit: spy}}
			var updated = {tag: "a", attrs: {oninit: spy, oncreate: spy}}
			render(root, [vnode])
			render(root, [updated])
			render(root, [])
	
			o(spy.callCount).equals(1)
			o(vnode.reuse).equals(true)
		})
		o("*update", function() {
			var vnode = {tag: "a", reuse: true, attrs: {onupdate: spy, onbeforeupdate: spy}}
			render(root, [vnode])
			render(root, [])
	
			o(spy.callCount).equals(0)
			o(vnode.reuse).equals(true)
		})
		o("*remove", function() {
			var vnode = {tag: "a", reuse: true, attrs: {onbeforeremove: spy, onremove: spy}}
			var updated = {tag: "a", attrs: {}}
			render(root, [vnode])
			render(root, [updated])
			render(root, [])
	
			o(spy.callCount).equals(0)
			o(vnode.reuse).equals(true)
		})
	})
	components.forEach(function(cmp){
		o.spec(cmp.kind + " reuse", function(){
			var createComponent = cmp.create
			function doReuse(vnode) {vnode.reuse = true}
			function dontReuse(vnode) {vnode.reuse = false}
			o("components take the reuse value of the instance into account on creation", function() {
				var itrue = createComponent({view: function() {return {tag: "a", reuse: true}}})
				var ifalse = createComponent({view: function() {return {tag: "a", reuse: false}}})
				var ctt = {tag: itrue, reuse: true}
				var ctf = {tag: itrue, reuse: false}
				var cft = {tag: ifalse, reuse: true}
				var cff = {tag: ifalse, reuse: false}
				render(root, [{tag: "[", reuse: false, children: [ctt]}])
				// the final "reuse" state is computed when the nodes are removed
				render(root, [null])
				render(root, [{tag: "[", reuse: false, children: [ctf]}])
				render(root, [null])
				render(root, [{tag: "[", reuse: false, children: [cft]}])
				render(root, [null])
				render(root, [{tag: "[", reuse: false, children: [cff]}])
				render(root, [null])
				
				o(ctt.reuse).equals(true)
				o(ctf.reuse).equals(false)
				o(cft.reuse).equals(false)
				o(cff.reuse).equals(false)
			})
			o("components take the reuse value of the instance into account on update", function() {
				var itrue = createComponent({
					view: function() {return {tag: "a", attrs: {onupdate: doReuse}}}
				})
				var ifalse = createComponent({
					view: function() {return {tag: "a", attrs: {onupdate: dontReuse}}}
				})
				var ctt1 = {tag: itrue}
				var ctf1 = {tag: itrue}
				var cft1 = {tag: ifalse}
				var cff1 = {tag: ifalse}
				var ctt2 = {tag: itrue, attrs: {onupdate: doReuse}}
				var ctf2 = {tag: itrue, attrs: {onupdate: dontReuse}}
				var cft2 = {tag: ifalse, attrs: {onupdate: doReuse}}
				var cff2 = {tag: ifalse, attrs: {onupdate: dontReuse}}

				render(root, [{tag: "[", reuse: false, children: [ctt1]}])
				render(root, [{tag: "[", reuse: false, children: [ctt2]}])
				render(root, [])
				render(root, [{tag: "[", reuse: false, children: [ctf1]}])
				render(root, [{tag: "[", reuse: false, children: [ctf2]}])
				render(root, [])
				render(root, [{tag: "[", reuse: false, children: [cft1]}])
				render(root, [{tag: "[", reuse: false, children: [cft2]}])
				render(root, [])
				render(root, [{tag: "[", reuse: false, children: [cff1]}])
				render(root, [{tag: "[", reuse: false, children: [cff2]}])
				render(root, [])
				
				o(ctt2.reuse).equals(true)
				o(ctf2.reuse).equals(false)
				o(cft2.reuse).equals(false)
				o(cff2.reuse).equals(false)
			})
			o("components take the reuse value of the instance into account on remove", function() {
				var itrue = createComponent({
					view: function() {return {tag: "a", attrs: {onremove: doReuse}}}
				})
				var ifalse = createComponent({
					view: function() {return {tag: "a", attrs: {onremove: dontReuse}}}
				})
				var ctt = {tag: itrue, attrs: {onremove: doReuse}}
				var ctf = {tag: itrue, attrs: {onremove: dontReuse}}
				var cft = {tag: ifalse, attrs: {onremove: doReuse}}
				var cff = {tag: ifalse, attrs: {onremove: dontReuse}}

				render(root, [{tag: "[", reuse: false, children: [ctt]}])
				render(root, [])
				render(root, [{tag: "[", reuse: false, children: [ctf]}])
				render(root, [])
				render(root, [{tag: "[", reuse: false, children: [cft]}])
				render(root, [])
				render(root, [{tag: "[", reuse: false, children: [cff]}])
				render(root, [])
				
				o(ctt.reuse).equals(true)
				o(ctf.reuse).equals(false)
				o(cft.reuse).equals(false)
				o(cff.reuse).equals(false)
			})
			o.spec("is set to false before calling hooks that can access the DOM", function(){
				function addSpies(target, keys) {
					keys.forEach(function(k) {
						target[k] = o.spy(function(vnode) {o(vnode.reuse).equals(false)})
					})
				}
				o("oninit on the component doesn't prevent reuse", function() {
					var tpl = {
						view: function(){return {tag:"a"}},
						oninit: o.spy(function(vnode) {o(vnode.reuse).equals(true)})
					}
					var component = createComponent(tpl)
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [])

					o(tpl.oninit.callCount).equals(1)
				})
				o("oninit on the attrs doesn't prevent reuse", function() {
					var attrs = {oninit: o.spy(function(vnode) {o(vnode.reuse).equals(true)})}
					var component = createComponent({view: function(){return {tag:"a"}}})
					render(root, [{tag: "[", reuse: false, children: [{tag: component, attrs: attrs}]}])
					render(root, [])

					o(attrs.oninit.callCount).equals(1)
				})
				o("oncreate on the component", function() {
					var tpl = {view: function(){return {tag:"a"}}}
					addSpies(tpl, ["oncreate"])
					var component = createComponent(tpl)
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [])

					o(tpl.oncreate.callCount).equals(1)
				})
				o("oncreate on the attrs", function() {
					var attrs = {}
					addSpies(attrs, ["oncreate"])
					var component = createComponent({view: function(){return {tag:"a"}}})
					render(root, [{tag: "[", reuse: false, children: [{tag: component, attrs: attrs}]}])
					render(root, [])

					o(attrs.oncreate.callCount).equals(1)
				})
				o("onbeforeupdate on the component", function() {
					var tpl = {view: function(){return {tag:"a"}}}
					addSpies(tpl, ["onbeforeupdate"])
					var component = createComponent(tpl)
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [])

					o(tpl.onbeforeupdate.callCount).equals(1)
				})
				o("onbeforeupdate on the attrs", function() {
					var attrs = {}
					addSpies(attrs, ["onbeforeupdate"])
					var component = createComponent({view: function(){return {tag:"a"}}})
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [{tag: "[", reuse: false, children: [{tag: component, attrs: attrs}]}])
					render(root, [])

					o(attrs.onbeforeupdate.callCount).equals(1)
				})
				o("onupdate on the component", function() {
					var tpl = {view: function(){return {tag:"a"}}}
					addSpies(tpl, ["onupdate"])
					var component = createComponent(tpl)
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [])

					o(tpl.onupdate.callCount).equals(1)
				})
				o("onupdate on the attrs", function() {
					var attrs = {}
					addSpies(attrs, ["onupdate"])
					var component = createComponent({view: function(){return {tag:"a"}}})
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [{tag: "[", reuse: false, children: [{tag: component, attrs: attrs}]}])
					render(root, [])

					o(attrs.onupdate.callCount).equals(1)
				})
				o("onbeforeremove on the component", function() {
					var tpl = {view: function(){return {tag:"a"}}}
					addSpies(tpl, ["onbeforeremove"])
					var component = createComponent(tpl)
					render(root, [{tag: component}])
					render(root, [])

					o(tpl.onbeforeremove.callCount).equals(1)
				})
				o("onbeforeremove on the attrs", function() {
					var attrs = {}
					addSpies(attrs, ["onbeforeremove"])
					var component = createComponent({view: function(){return {tag:"a"}}})
					render(root, [{tag: component, attrs: attrs}])
					render(root, [])

					o(attrs.onbeforeremove.callCount).equals(1)
				})
				o("onremove on the component", function() {
					var tpl = {view: function(){return {tag:"a"}}}
					addSpies(tpl, ["onremove"])
					var component = createComponent(tpl)
					render(root, [{tag: "[", reuse: false, children: [{tag: component}]}])
					render(root, [])

					o(tpl.onremove.callCount).equals(1)
				})
				o("onremove on the attrs", function() {
					var attrs = {}
					addSpies(attrs, ["onremove"])
					var component = createComponent({view: function(){return {tag:"a"}}})
					render(root, [{tag: "[", reuse: true, children: [{tag: component, attrs: attrs}]}])
					render(root, [])

					o(attrs.onremove.callCount).equals(1)
				})
			})
			o.spec("is not affected by hooks that don't fire", function() {
				var spy
				o.beforeEach(function() {
					spy = o.spy()
				})
				o("*create", function() {
					var component = createComponent({
						view: function() {return {tag: "a"}},
						oninit: spy
					})
					var vnode = {tag: component, reuse: true, attrs: {oninit: spy}}
					var updated = {tag: component, reuse: true, attrs: {oninit: spy, oncreate: spy}}
					render(root, [vnode])
					render(root, [updated])
					render(root, [])

					o(spy.callCount).equals(2)
					o(vnode.reuse).equals(true)
				})
				o("*update", function() {
					var component = createComponent({
						view: function() {return {tag: "a"}},
						onupdate: spy, onbeforeupdate:spy
					})
					var vnode = {tag: component, reuse: true, attrs: {onupdate: spy, onbeforeupdate: spy}}
					render(root, [vnode])
					render(root, [])

					o(spy.callCount).equals(0)
					o(vnode.reuse).equals(true)
				})
				o("*remove", function() {
					var component = createComponent({
						view: function() {return {tag: "a"}},
						onremove: spy, onbeforeremove: spy, oninit: function(vnode){
							vnode.state.onremove = null
							vnode.state.onbeforeremove = null
						}
					})
					var vnode = {tag: component, reuse: true, attrs: {onbeforeremove: spy, onremove: spy}}
					var updated = {tag: component, attrs: {}}
					render(root, [vnode])
					render(root, [updated])
					render(root, [])

					o(spy.callCount).equals(0)
					o(vnode.reuse).equals(true)
				})
			})
		})
	})
})
