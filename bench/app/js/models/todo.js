/* global m */

(function (app) {
	"use strict"

	// Todo Model
	app.Todo = function (data) {
		this.title = m.prop(data.title)
		this.completed = m.prop(data.completed || false)
		this.editing = m.prop(data.editing || false)
	}
})(this.app || (this.app = {}))
