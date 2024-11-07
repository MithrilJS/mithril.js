/** @param {number} value */
export function serializeTime(value) {
	let sign = ""
	let unit = "ms"
	let precision = 0

	if (value < 0) {
		sign = "-"
		value = -value
	}

	if (value >= 1000) {
		value /= 1000
		unit = "s"
	} else if (value >= 0.995) {
		precision = 3
	} else if (value >= 0.000995) {
		precision = 3
		value *= 1000
		unit = "µs"
	} else {
		precision = value >= 0.000000995 ? 3 : 2
		value *= 1000000
		unit = "ns"
	}

	return `${sign}${precision ? value.toPrecision(precision) : `${Math.round(value)}`} ${unit}`
}

export const serializeNumber = new Intl.NumberFormat(undefined, {useGrouping: true}).format

export function serializeRate(value, op) {
	return `${serializeTime(value)}/${op} (${serializeNumber(Math.round(1000 / value))} Hz)`
}
