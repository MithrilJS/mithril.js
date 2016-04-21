"use strict";

var h = React.createElement

var Query = React.createClass({
	shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.elapsedClassName !== this.props.elapsedClassName) return true;
		if (nextProps.formatElapsed !== this.props.formatElapsed) return true;
		if (nextProps.query !== this.props.query) return true;
		return false;
	},
	render: function render() {
		return h("td", { className: "Query " + this.props.elapsedClassName },
			this.props.formatElapsed,
			h("div", { className: "popover left" },
				h("div", { className: "popover-content" }, this.props.query),
				h("div", { className: "arrow" })
			)
		);
	}
});

var Database = React.createClass({
	shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.lastMutationId === this.props.lastMutationId) return false;
		return true;
	},
	render: function render() {
		var lastSample = this.props.lastSample;
		return h("tr", { key: this.props.dbname },
			h("td", { className: "dbname" }, this.props.dbname),
			h("td", { className: "query-count" },
				h("span", { className: this.props.lastSample.countClassName }, this.props.lastSample.nbQueries)
			),
			this.props.lastSample.topFiveQueries.map(function (query, index) {
				return h(Query, {
					key: index,
					query: query.query,
					elapsed: query.elapsed,
					formatElapsed: query.formatElapsed,
					elapsedClassName: query.elapsedClassName
				});
			})
		);
	}
});

var DBMon = React.createClass({
	getInitialState: function getInitialState() {
		return {
			databases: []
		};
	},

	loadSamples: function loadSamples() {
		this.setState({
			databases: ENV.generateData(true).toArray()
		});
		Monitoring.renderRate.ping();
		setTimeout(this.loadSamples, ENV.timeout);
	},

	componentDidMount: function componentDidMount() {
		this.loadSamples();
	},

	render: function render() {
		return h("div", null,
			h("table", { className: "table table-striped latest-data" },
				h("tbody", null, this.state.databases.map(function (database) {
					return h(Database, {
						key: database.dbname,
						lastMutationId: database.lastMutationId,
						dbname: database.dbname,
						samples: database.samples,
						lastSample: database.lastSample
					});
				}))
			)
		);
	}
});

ReactDOM.render(h(DBMon, null), document.getElementById('app'));