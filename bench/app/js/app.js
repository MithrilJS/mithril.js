/* global m */
(function (app) {
	"use strict"

	app.ENTER_KEY = 13
	app.ESC_KEY = 27

	m.route.mode = "hash"
	m.route(document.getElementById("todoapp"), "/", {
		"/": app,
		"/:filter": app
	})
})(this.app || (this.app = {}))
