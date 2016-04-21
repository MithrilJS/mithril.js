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
		m("table", { className: "table table-striped latest-data" }, [
			m("tbody", 
				data.map(function(db) {
					return m("tr", {key: db.dbname}, [
						m("td", { className: "dbname" }, db.dbname),
						m("td", { className: "query-count" },  [
							m("span", { className: db.lastSample.countClassName }, db.lastSample.nbQueries)
						]),
						db.lastSample.topFiveQueries.map(function(query) {
							return m("td", { className: query.elapsedClassName }, [
								m("span", query.formatElapsed),
								m("div", { className: "popover left" }, [
									m("div", { className: "popover-content" }, query.query),
									m("div", { className: "arrow" })
								])
							])
						})
					])
				})
			)
		])
	])
}
