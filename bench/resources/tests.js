(function (global) {
	"use strict"

	var BenchmarkTestStep = global.BenchmarkTestStep
	var Suites = global.Suites = []

	Suites.push(function (numberOfItemsToAdd) {
		return {
			name: "Mithril (TodoMVC 1.3)",
			url: "app/index.html",
			version: "next (dev version)",
			prepare: function (runner) {
				return runner.waitForElement("#new-todo")
				.then(function (element) {
					element.focus()
					return element
				})
			},
			tests: [
				new BenchmarkTestStep("Adding" + numberOfItemsToAdd + "Items",
				function (newTodo) {
					for (var i = 0; i < numberOfItemsToAdd; i++) {
						var inputEvent = document.createEvent("Event")
						inputEvent.initEvent("input", true, true)
						newTodo.value = "Mithril ------- Something to do " + i
						newTodo.dispatchEvent(inputEvent)

						var keydownEvent = document.createEvent("Event")
						keydownEvent.initEvent("keyup", true, true)
						keydownEvent.keyCode = 13 // VK_ENTER
						newTodo.dispatchEvent(keydownEvent)
					}
				}),
				new BenchmarkTestStep("CompletingAllItems",
				function (newTodo, contentWindow, document) {
					var checkboxes = document.getElementsByClassName("toggle")
					for (var i = 0; i < checkboxes.length; i++) {
						checkboxes[i].click()
					}
				}),
				new BenchmarkTestStep("DeletingAllItems",
				function (newTodo, contentWindow, document) {
					var buttons = document.getElementsByClassName("destroy")
					for (var i = buttons.length - 1; i > -1; i--) {
						buttons[i].click()
					}
				})
			]
		}
	})
})(this)
