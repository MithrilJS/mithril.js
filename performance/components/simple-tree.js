import m from "../../dist/mithril.esm.min.js"

const fields = []

for (let i=100; i--;) {
	fields.push((i * 999).toString(36))
}

export const simpleTree = () => m(".foo.bar[data-foo=bar]", {p: 2},
	m("header",
		m("h1.asdf", "a ", "b", " c ", 0, " d"),
		m("nav",
			m("a[href=/foo]", "Foo"),
			m("a[href=/bar]", "Bar")
		)
	),
	m("main",
		m("form",
			{onsubmit() {}},
			m("input[type=checkbox][checked]"),
			m("input[type=checkbox]"),
			m("fieldset", fields.map((field) =>
				m("label", field, ":", m("input", {placeholder: field}))
			)),
			m("button-bar",
				m("button",
					{style: "width:10px; height:10px; border:1px solid #FFF;"},
					"Normal CSS"
				),
				m("button",
					{style: "top:0 ; right: 20"},
					"Poor CSS"
				),
				m("button",
					{style: "invalid-prop:1;padding:1px;font:12px/1.1 arial,sans-serif;", icon: true},
					"Poorer CSS"
				),
				m("button",
					{style: {margin: 0, padding: "10px", overflow: "visible"}},
					"Object CSS"
				)
			)
		)
	)
)
