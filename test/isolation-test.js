/* global m, test, mock */
(function () {
	"use strict"

	m.deps(mock.window)

	test(function () { // eslint-disable-line max-statements
		var root = mock.document.createElement("div")
		var retain = false
		var flag = true
		var loaded1 = null
		var loaded2 = null
		var loaded1a = null
		var loaded2a = null

		var Comp1 = {
			controller: function () {
				loaded1 = true
				this.onunload = function () {
					loaded1 = false
				}
			},
			view: function () {
				if (retain) {
					return {subtree: "retain"}
				} else {
					return m("a", {
						config: function (el, init, ctx) {
							if (!init) {
								loaded1a = true
								ctx.onunload = function () {
									loaded1a = false
								}
							}
						}
					})
				}
			}
		}

		var Comp2 = {
			controller: function () {
				loaded2 = true
				this.onunload = function () {
					loaded2 = false
				}
			},
			view: function () {
				if (retain) {
					return {subtree: "retain"}
				} else {
					return m("b", {
						config: function (el, init, ctx) {
							if (!init) {
								loaded2a = true
								ctx.onunload = function () {
									loaded2a = false
								}
							}
						}
					})
				}
			}
		}

		var Root = {
			view: function () {
				return flag ? Comp1 : Comp2
			}
		}

		m.mount(root, Root)

		mock.requestAnimationFrame.$resolve()

		// loaded 1
		var result1 = loaded1 === true &&
			loaded2 === null &&
			loaded1a === true &&
			loaded2a === null

		retain = true
		m.redraw(true)
		mock.requestAnimationFrame.$resolve()

		// retained
		var result2 = loaded1 === true &&
			loaded2 === null &&
			loaded1a === true &&
			loaded2a === null

		flag = false
		m.redraw(true)
		mock.requestAnimationFrame.$resolve()

		// loaded 2 while retained: both controllers are alive at the same time
		// because dom element is retained
		var result3 = loaded1 === true &&
			loaded2 === true &&
			loaded1a === true &&
			loaded2a === null

		retain = false
		m.redraw(true)
		mock.requestAnimationFrame.$resolve()

		// unretained, i.e. 2 is now dynamic
		var result4 = loaded1 === false &&
			loaded2 === true &&
			loaded1a === false &&
			loaded2a === true

		flag = true
		m.redraw(true)
		mock.requestAnimationFrame.$resolve()

		// loaded 1 while dynamic
		var result5 = loaded1 === true &&
			loaded2 === false &&
			loaded1a === true &&
			loaded2a === false

		return result1 && result2 && result3 && result4 && result5
	})

	/*
	test(function() {
		var root = mock.document.createElement("div")
		var redraws = 0, data
		var Root = {
			view: function() {
				return Comp
			}
		}

		var Comp = {
			controller: function() {
				this.foo = m.request({method: "GET", url: "/foo"})
			},
			view: function(ctrl) {
				redraws++
				data = ctrl.foo()
				return m("div")
			}
		}

		m.mount(root, Root)

		mock.requestAnimationFrame.$resolve()
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()

		return redraws == 1 && data.url == "/foo"
	})
	*/

	test.print(function (value) {
		console.log(value) // eslint-disable-line no-console
	})
})()
