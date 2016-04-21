"use strict"

var m = require("../../../render/hyperscript")
var render = require("../../../render/render")(window).render

var data = []

var root = document.getElementById("app")
update()

function update() {
	data = ENV.generateData().toArray()
		
	Monitoring.renderRate.ping()
	
	render(root, [view()])
	
	setTimeout(update, ENV.timeout)
}

function view() {
	return m("div", [
		m("table", { class: "table table-striped latest-data" }, [
			m("tbody", 
				data.map(function(db) {
					return m("tr", {key: db.dbname}, [
						m("td", { class: "dbname" }, db.dbname),
						m("td", { class: "query-count" },  [
							m("span", { class: db.lastSample.countclassName }, db.lastSample.nbQueries)
						]),
						db.lastSample.topFiveQueries.map(function(query) {
							return m("td", { class: query.elapsedclassName }, [
								m("span", query.formatElapsed),
								m("div", { class: "popover left" }, [
									m("div", { class: "popover-content" }, query.query),
									m("div", { class: "arrow" })
								])
							])
						})
					])
				})
			)
		])
	])
}
/*
function view() {
	return m("div", [
		m("table.table.table-striped.latest-data", [
			m("tbody", 
				data.map(function(db) {
					return m("tr", {key: db.dbname}, [
						m("td.dbname", db.dbname),
						m("td.query-count",  [
							m("span", { class: db.lastSample.countclassName }, db.lastSample.nbQueries)
						]),
						db.lastSample.topFiveQueries.map(function(query) {
							return m("td", { class: query.elapsedclassName }, [
								m("span", query.formatElapsed),
								m("div.popover.left", [
									m("div.popover-content", query.query),
									m("div.arrow")
								])
							])
						})
					])
				})
			)
		])
	])
}
*/