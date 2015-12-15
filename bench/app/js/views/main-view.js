/* global m */
(function (app) {
	"use strict"

	// View utility
	app.watchInput = function (onenter, onescape) {
		return function (e) {
			if (e.keyCode === app.ENTER_KEY) {
				onenter()
			} else if (e.keyCode === app.ESC_KEY) {
				onescape()
			}
		}
	}

	var header = {
		controller: function () {
			this.focused = false
		},

		view: function (ctrl, parentCtrl) {
			return m("header#header", [
				m("h1", "todos"),
				m('input#new-todo[placeholder="What needs to be done?"]', {
					onkeyup: app.watchInput(
						function () {
							parentCtrl.add()
						},
						function () {
							parentCtrl.clearTitle()
						}),
					value: parentCtrl.title(),
					oninput: m.withAttr("value", parentCtrl.title),
					config: function (element) {
						if (!ctrl.focused) {
							element.focus()
							ctrl.focused = true
						}
					}
				})
			])
		}
	}

	var todo = {
		view: function (_, parentCtrl, task, index) {
			return m("li", {
				class: (task.completed() ? "completed" : "") +
					(task.editing() ? " editing" : "")
			}, [
				m(".view", [
					m("input.toggle[type=checkbox]", {
						onclick: m.withAttr("checked", function () {
							parentCtrl.complete(task)
						}),
						checked: task.completed()
					}),
					m("label", {
						ondblclick: function () {
							parentCtrl.edit(task)
						}
					}, task.title()),
					m("button.destroy", {
						onclick: function () {
							parentCtrl.remove(index)
						}
					})
				]),
				m("input.edit", {
					value: task.title(),
					onkeyup: app.watchInput(
						function () {
							parentCtrl.doneEditing(task, index)
						},
						function () {
							parentCtrl.cancelEditing(task)
						}),
					oninput: m.withAttr("value", task.title),
					config: function (element) {
						if (task.editing()) {
							element.focus()
							element.selectionStart =
								element.value.length
						}
					},
					onblur: function () {
						parentCtrl.doneEditing(task, index)
					}
				})
			])
		}
	}

	app.view = function (ctrl) {
		return m("div", [
			m(header, ctrl),
			m("section#main", {
				style: {
					display: ctrl.list.length ? "" : "none"
				}
			}, [
				m("input#toggle-all[type=checkbox]", {
					onclick: ctrl.completeAll.bind(ctrl),
					checked: ctrl.allCompleted()
				}),
				m("ul#todo-list", [
					ctrl.list
					.filter(function () {
						return ctrl.isVisible()
					})
					.map(function (task, index) {
						return m(todo, ctrl, task, index)
					})
				])
			]),
			ctrl.list.length === 0 ? "" : m(app.footer, ctrl)
		])
	}
})(this.app || (this.app = {}))
