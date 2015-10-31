/* eslint-env browser, mocha */
/* global m, mock */
this.dom = function (cb) {
	"use strict"
	context("(requires real DOM)", function () {
		before(function () {
			m.deps(window)
		})

		after(function () {
			m.deps(mock)
		})

		cb()
	})
}
