/* global m */
(function (app) {
	"use strict"

	var filter = {
		view: function (_, ctrl, expected, name, href) {
			return m("li", [
				m("a", {
					href: href,
					config: m.route,
					class: ctrl.filter() === expected ? "selected" : ""
				}, name)
			])
		}
	}

	app.footer = {
		view: function (_, ctrl) {
			var amountCompleted = ctrl.amountCompleted()
			var amountActive = ctrl.list.length - amountCompleted

			return m("footer#footer", [
				m("span#todo-count", [
					m("strong", amountActive), " item" +
						(amountActive !== 1 ? "s" : "") + " left"
				]),
				m("ul#filters", [
					m(filter, ctrl, "", "All", "/"),
					m(filter, ctrl, "active", "Active", "/active"),
					m(filter, ctrl, "completed", "Completed", "/completed")
				]),
				ctrl.amountCompleted() ? m("button#clear-completed", {
					onclick: function () {
						ctrl.clearCompleted()
					}
				}, "Clear completed") : null
			])
		}
	}
})(this.app || (this.app = {}))
