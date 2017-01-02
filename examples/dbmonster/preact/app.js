"use strict"

var h = preact.h

perfMonitor.startFPSMonitor()
perfMonitor.startMemMonitor()
perfMonitor.initProfiler("render")

function createClass(obj) {
   // sub-class Component:
   function F(){ preact.Component.call(this); }
   var p = F.prototype = new preact.Component;
   // copy our skeleton into the prototype:
   for (var i in obj) {
            if (i === 'getDefaultProps' && typeof obj.getDefaultProps === 'function') {
                F.defaultProps = obj.getDefaultProps() || {};
            } else {
                p[i] = obj[i];
            }
        }
   // restore constructor:
   return p.constructor = F;
}

var DBMon = createClass({
  componentWillMount: function () {
    this.setState({data: ENV.generateData().toArray()});
  },

  componentDidMount: function () {
    var me = this
    me.rendered = true;

    function update() {
      if (!me.rendered) {
        throw 'Attempting rerender before render finished';
      }

      me.rendered = false
      perfMonitor.startProfile("render")

      me.setState({data: ENV.generateData().toArray()})

      perfMonitor.endProfile("render")

      setTimeout(update, ENV.timeout)
    }

    update()
  },

  componentDidUpdate: function () {
    this.rendered = true;
  },

  render: function (props, state) {
    var data = state.data

    return h("div", null,
      h("table", {className: "table table-striped latest-data"},
         h("tbody", null,
            data.map(function(db) {
               return h("tr", {key: db.dbname},
                  h("td", {className: "dbname"}, db.dbname),
                  h("td", {className: "query-count"},
                     h("span", {className: db.lastSample.countClassName}, db.lastSample.nbQueries)
                  ),
                  db.lastSample.topFiveQueries.map(function(query, i) {
                     return h("td", {key: i, className: query.elapsedClassName},
                        query.formatElapsed,
                        h("div", {className: "popover left"},
                           h("div", {className: "popover-content"}, query.query),
                           h("div", {className: "arrow"})
                        )
                     )
                  })
               )
            })
         )
      )
    )
  }
});

preact.render(h(DBMon), document.getElementById("app"))
