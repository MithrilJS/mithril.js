"use strict"

var data = []

var root = document.getElementById("app")
update()

function update() {
	data = ENV.generateData().toArray()

	Monitoring.renderRate.ping()

	m.redraw();

	setTimeout(update, ENV.timeout)
}

m.mount(root, {
	view : function() {
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
});
