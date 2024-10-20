import m from "../../dist/mithril.esm.min.js"

const fields = []

for (let i=100; i--;) {
	fields.push((i * 999).toString(36))
}

var NestedHeader = () => m("header",
	m("h1.asdf", "a ", "b", " c ", 0, " d"),
	m("nav",
		m("a", {href: "/foo"}, "Foo"),
		m("a", {href: "/bar"}, "Bar")
	)
)

var NestedForm = () => m("form", {onsubmit() {}},
	m("input[type=checkbox][checked]"),
	m("input[type=checkbox]", {checked: false}),
	m("fieldset",
		m("label",
			m("input[type=radio][checked]")
		),
		m("label",
			m("input[type=radio]")
		)
	),
	m("fieldset", fields.map((field) =>
		m("label", field, ":", m("input", {placeholder: field}))
	)),
	m(NestedButtonBar, null)
)

var NestedButtonBar = () => m(".button-bar",
	m(NestedButton,
		{style: "width:10px; height:10px; border:1px solid #FFF;"},
		"Normal CSS"
	),
	m(NestedButton,
		{style: "top:0 ; right: 20"},
		"Poor CSS"
	),
	m(NestedButton,
		{style: "invalid-prop:1;padding:1px;font:12px/1.1 arial,sans-serif;", icon: true},
		"Poorer CSS"
	),
	m(NestedButton,
		{style: {margin: 0, padding: "10px", overflow: "visible"}},
		"Object CSS"
	)
)

var NestedButton = (attrs) => m("button", attrs)

var NestedMain = () => m(NestedForm)

var NestedRoot = () => m("div.foo.bar[data-foo=bar]",
	{p: 2},
	m(NestedHeader),
	m(NestedMain)
)

export const nestedTree = () => m(NestedRoot)
