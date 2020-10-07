"use strict"

var o = require("ospec")
var censor = require("../../util/censor")

o.spec("censor", function() {
	o.spec("magic missing, no extras", function() {
		o("returns new object", function() {
			var original = {one: "two"}
			var censored = censor(original)
			o(censored).notEquals(original)
			o(censored).deepEquals({one: "two"})
		})
		o("does not modify original object", function() {
			var original = {one: "two"}
			censor(original)
			o(original).deepEquals({one: "two"})
		})
	})

	o.spec("magic present, no extras", function() {
		o("returns new object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			var censored = censor(original)
			o(censored).notEquals(original)
			o(censored).deepEquals({one: "two"})
		})
		o("does not modify original object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			censor(original)
			o(original).deepEquals({
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			})
		})
	})

	o.spec("magic missing, null extras", function() {
		o("returns new object", function() {
			var original = {one: "two"}
			var censored = censor(original, null)
			o(censored).notEquals(original)
			o(censored).deepEquals({one: "two"})
		})
		o("does not modify original object", function() {
			var original = {one: "two"}
			censor(original, null)
			o(original).deepEquals({one: "two"})
		})
	})

	o.spec("magic present, null extras", function() {
		o("returns new object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			var censored = censor(original, null)
			o(censored).notEquals(original)
			o(censored).deepEquals({one: "two"})
		})
		o("does not modify original object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			censor(original, null)
			o(original).deepEquals({
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			})
		})
	})

	o.spec("magic missing, extras missing", function() {
		o("returns new object", function() {
			var original = {one: "two"}
			var censored = censor(original, ["extra"])
			o(censored).notEquals(original)
			o(censored).deepEquals({one: "two"})
		})
		o("does not modify original object", function() {
			var original = {one: "two"}
			censor(original, ["extra"])
			o(original).deepEquals({one: "two"})
		})
	})

	o.spec("magic present, extras missing", function() {
		o("returns new object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			var censored = censor(original, ["extra"])
			o(censored).notEquals(original)
			o(censored).deepEquals({one: "two"})
		})
		o("does not modify original object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			censor(original, ["extra"])
			o(original).deepEquals({
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			})
		})
	})

	o.spec("magic missing, extras present", function() {
		o("returns new object", function() {
			var original = {
				one: "two",
				extra: "test",
			}
			var censored = censor(original, ["extra"])
			o(censored).notEquals(original)
			o(censored).deepEquals({one: "two"})
		})
		o("does not modify original object", function() {
			var original = {
				one: "two",
				extra: "test",
			}
			censor(original, ["extra"])
			o(original).deepEquals({
				one: "two",
				extra: "test",
			})
		})
	})

	o.spec("magic present, extras present", function() {
		o("returns new object", function() {
			var original = {
				one: "two",
				extra: "test",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			var censored = censor(original, ["extra"])
			o(censored).notEquals(original)
			o(censored).deepEquals({one: "two"})
		})
		o("does not modify original object", function() {
			var original = {
				one: "two",
				extra: "test",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			censor(original, ["extra"])
			o(original).deepEquals({
				one: "two",
				extra: "test",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			})
		})
	})
})
