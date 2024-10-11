import m from "../../dist/mithril.esm.min.js"

const vnodeCount = 300

// The length is simply the lowest common multiple of all the modulos for the style generation.
const styleCount = 10200

const multivalue = ["0 1px", "0 0 1px 0", "0", "1px", "20px 10px", "7em 5px", "1px 0 5em 2px"]
const classes = ["foo", "foo bar", "", "baz-bat", null, "fooga", null, null, undefined]
const styles = []

const toColor = (c) => `rgba(${c % 255},${255 - c % 255},${50 + c % 150},${c % 50 / 50})`

const get = (array, index) => array[index % array.length]

for (let i = 0, counter = 0; i < styleCount; i++) {
	const c = ++counter
	const style = {}
	styles.push(style)
	switch (i % 8) {
		case 7:
			style.border = c % 5 ? `${c % 10}px ${c % 2 ? "solid" : "dotted"} ${toColor(c)}` : ""
			// falls through
		case 6:
			style.color = toColor(c)
			// falls through
		case 5:
			style.display = c % 10 ? c % 2 ? "block" : "inline" : "none"
			// falls through
		case 4:
			style.position = c % 5 ? c % 2 ? "absolute" : "relative" : null
			// falls through
		case 3:
			style.padding = get(multivalue, c)
			// falls through
		case 2:
			style.margin = get(multivalue, c).replace("1px", `${c}px`)
			// falls through
		case 1:
			style.top = c % 2 ? `${c}px` : c
			// falls through
		case 0:
			style.left = c % 3 ? `${c}px` : c
			// falls through
	}
}

const titles = [
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h",
	"i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
]

const inputValues = ["test0", "test1", "test2", "test3"]

let count = 0

export function mutateStylesPropertiesTree() {
	count += vnodeCount
	var vnodes = []
	for (var i = 0; i < vnodeCount; i++) {
		var index = i + count
		vnodes.push(
			m("div.booga",
				{
					class: get(classes, index),
					"data-index": index,
					title: get(titles, index),
				},
				m("input.dooga", {type: "checkbox", checked: index % 3 === 0}),
				m("input", {value: get(inputValues, index), disabled: index % 10 ? null : true}),
				m("div", {class: get(classes, Math.imul(index, 11))},
					m("p", {style: get(styles, index)}, "p1"),
					m("p", {style: get(styles, index + 1)}, "p2"),
					m("p", {style: get(styles, Math.imul(index, 2))}, "p3"),
					m("p.zooga", {style: get(styles, Math.imul(index, 3) + 1), className: get(classes, Math.imul(index, 7))}, "p4")
				)
			)
		)
	}
	return vnodes
}
