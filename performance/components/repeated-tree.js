import m from "../../dist/mithril.esm.min.js"

const RepeatedHeader = () => m("header",
	m("h1.asdf", "a ", "b", " c ", 0, " d"),
	m("nav",
		m("a", {href: "/foo"}, "Foo"),
		m("a", {href: "/bar"}, "Bar")
	)
)

const RepeatedForm = () => m("form", {onSubmit() {}},
	m("input", {type: "checkbox", checked: true}),
	m("input", {type: "checkbox", checked: false}),
	m("fieldset",
		m("label",
			m("input", {type: "radio", checked: true})
		),
		m("label",
			m("input", {type: "radio"})
		)
	),
	m(RepeatedButtonBar, null)
)

const RepeatedButtonBar = () => m(".button-bar",
	m(RepeatedButton,
		{style: "width:10px; height:10px; border:1px solid #FFF;"},
		"Normal CSS"
	),
	m(RepeatedButton,
		{style: "top:0 ; right: 20"},
		"Poor CSS"
	),
	m(RepeatedButton,
		{style: "invalid-prop:1;padding:1px;font:12px/1.1 arial,sans-serif;", icon: true},
		"Poorer CSS"
	),
	m(RepeatedButton,
		{style: {margin: 0, padding: "10px", overflow: "visible"}},
		"Object CSS"
	)
)

const RepeatedButton = (attrs) => m("button", attrs)

const RepeatedMain = () => m(RepeatedForm)

const RepeatedRoot = () => m("div.foo.bar[data-foo=bar]",
	{p: 2},
	m(RepeatedHeader, null),
	m(RepeatedMain, null)
)

export const repeatedTree = () => m(RepeatedRoot)
