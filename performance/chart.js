// As much as I'd like to use Mithril here, I can't. This part is specially desiged to allow for
// past and customized versions of Mithril to also be used in private benchmarks.
/* eslint-env browser */

import {serializeNumber, serializeRate, serializeTime} from "./serialized.js"

const OUTLIER_THRESHOLD = 1.5

/**
 * @typedef StatEntry
 * @property {string} name
 * @property {ReturnType<import("./stats.js")["currentDisplayStats"]>} stats
 * @property {ReturnType<import("./stats.js")["getSamples"]>} samples
 */

function toDecimal(value) {
	// Drop whatever roundoff error might exist.
	return Number(value).toFixed(value < 10 ? 2 : value < 100 ? 1 : 0)
}

function genLabelSet(count, fn) {
	const labels = Array.from({length: count}, (_, i) => fn(i))
	if (labels.every((l) => (/\d(?:\.0+)?(?:\D|$)/).test(l))) {
		return labels.map((l) => l.replace(/\.0+(\D|$)/, "$1"))
	} else if (labels.every((l) => (/\d\.[1-9]0+\D/).test(l))) {
		return labels.map((l) => l.replace(/(\.[1-9])0+(\D|$)/, "$1$2"))
	} else {
		return labels
	}
}

/** @param {StatEntry} entry */
function generateChart(entry) {
	let i = entry.samples.length - 2
	let maxDuration = entry.samples[i + 1].sum / entry.samples[i + 1].count
	let nextDuration = entry.samples[i].sum / entry.samples[i].count

	while (maxDuration > nextDuration * OUTLIER_THRESHOLD) {
		if (i === 0) {
			// This should never occur in practice.
			throw new Error("Failed to find max duration - all data points are too sparse.")
		}
		i--
		maxDuration = nextDuration
		nextDuration = entry.samples[i].sum / entry.samples[i].count
	}

	let unit = "ms"
	let scale = 1

	if (maxDuration < 0.001) {
		unit = "ns"
		scale = 1000000.0
	} else if (maxDuration < 1) {
		unit = "µs"
		scale = 1000.0
	} else if (maxDuration >= 1000) {
		unit = "s"
		scale = 0.001
	}

	// This performs a linear interpolation/extrapolation from point (len=50, value=4) to point
	// (len=100,value=2), clamps it to the interval 0.5 <= x <= 4, and returns the square root
	// of it. This scales by area rather than by radius, making for a nicer and more readable
	// chart regardless of point count.
	//
	// Since it's always the same points, I plugged one of them and simplified it so it's just a
	// one-liner. Here's the relevant formulas - I'll let you the reader (re-)derive it if you
	// really want to:
	// - Slope betwen two points: m = (y2-y1)/(x2-x1)
	// - Point slope: y-y1 = m*(x-x1)
	// - Slope intercept: y = m*x + b
	const size = Math.sqrt(Math.max(0.5, Math.min(4, 6 - entry.samples.length / 25)))

	const $canvas = document.createElement("canvas")

	// 360p is a nice canvas size to work with. Not too wide, not too narrow, not too tall, and not
	// too short.
	const height = 360
	const width = 640

	const ctx = $canvas.getContext("2d")

	if (!ctx) {
		throw new Error("2D context not available")
	}

	// Quick dance to deal with high-DPI devices, so 1px lines don't look blurry.
	$canvas.height = height * devicePixelRatio
	$canvas.width = width * devicePixelRatio
	$canvas.style.height = `${height}px`
	$canvas.style.width = `${width}px`
	ctx.scale(devicePixelRatio, devicePixelRatio)

	const segmentCount = 10

	const topPad = 10
	const rightPad = 25
	const yLabelPadding = 10
	const xLabelPadding = 10
	const tickOverhang = 5

	const xSegmentScale = entry.stats.pop / (segmentCount - 1)
	const ySegmentScale = maxDuration / (segmentCount - 1) * scale

	const xLabels = genLabelSet(segmentCount, (i) => {
		const value = xSegmentScale * i
		// This is for an integer count. Even if everything else is decimal, I at least want this
		// to be a fixed integer. Makes the chart look better IMHO.
		if (value === 0) return "0"
		if (value < 1000) return toDecimal(value)
		if (value < 1000000) return `${toDecimal(value / 1000)}K`
		return `${toDecimal(value / 1000000)}M`
	})

	const yLabels = genLabelSet(segmentCount, (i) => (
		`${toDecimal(ySegmentScale * i)} ${unit}`
	))

	const xLabelHeight = 12
	let yLabelWidth = 0

	ctx.font = `${xLabelHeight}px sans-serif`

	for (const label of yLabels) {
		yLabelWidth = Math.max(yLabelWidth, ctx.measureText(label).width)
	}

	const chartWidth = width - tickOverhang - yLabelWidth - yLabelPadding * 2 - rightPad
	const chartHeight = height - tickOverhang - xLabelHeight - xLabelPadding * 2 - topPad
	const xSegmentSize = chartWidth / (segmentCount - 1)
	const ySegmentSize = chartHeight / (segmentCount - 1)
	const chartXOffset = yLabelWidth + yLabelPadding * 2

	ctx.beginPath()
	ctx.lineWidth = 1
	ctx.strokeStyle = "#bbb"
	ctx.fillStyle = "none"

	for (let i = 0; i < segmentCount; i++) {
		ctx.moveTo(chartXOffset + tickOverhang + i * xSegmentSize, topPad)
		ctx.lineTo(chartXOffset + tickOverhang + i * xSegmentSize, topPad + chartHeight + tickOverhang)
		ctx.moveTo(chartXOffset, topPad + i * ySegmentSize)
		ctx.lineTo(chartXOffset + tickOverhang + chartWidth, topPad + i * ySegmentSize)
	}

	ctx.stroke()
	ctx.closePath()

	ctx.fillStyle = "#888"
	ctx.textBaseline = "middle"
	ctx.textAlign = "right"
	const yLabelOffset = chartXOffset - yLabelPadding
	yLabels.reverse()
	for (let i = 0; i < segmentCount; i++) {
		ctx.fillText(yLabels[i], yLabelOffset, topPad + i * ySegmentSize)
	}
	ctx.textAlign = "center"
	ctx.textBaseline = "bottom"
	const xLabelOffset = height - xLabelPadding
	for (let i = 0; i < segmentCount; i++) {
		ctx.fillText(xLabels[i], chartXOffset + tickOverhang + i * xSegmentSize, xLabelOffset)
	}

	ctx.beginPath()

	const xMin = chartXOffset + tickOverhang
	const yMin = height - tickOverhang - xLabelPadding * 2 - xLabelHeight
	const xMax = width - rightPad
	const yMax = topPad
	const sx = (xMax - xMin) / (xSegmentScale * (segmentCount - 1))
	const sy = (yMax - yMin) / (ySegmentScale * (segmentCount - 1))

	ctx.fillStyle = "#c00"

	let index = 0

	for (const {count, sum} of entry.samples) {
		const x0 = index
		index += count
		const x1 = index
		const x = (x0 + x1) / 2
		const y = sum / count
		const px = xMin + sx * x
		const py = yMin + sy * y * scale
		ctx.moveTo(px, py)
		ctx.ellipse(px, py, size, size, 0, 0, 2*Math.PI)
	}

	ctx.fill()
	ctx.closePath()

	return $canvas
}

function metricRow(label, values) {
	const $result = document.createElement("tr")
	const $label = document.createElement("td")
	const $values = document.createElement("td")
	$label.textContent = label
	$values.textContent = values
	$result.append($label, $values)
	return $result
}

/**
 * @param {StatEntry[]} statEntries
 */
export function renderCompleted(statEntries) {
	const style = document.createElement("link")
	style.rel = "stylesheet"
	style.href = "/performance/chart.css"
	document.head.append(style)

	const $root = document.createElement("div")
	$root.className = "root"

	const nullEntry = statEntries[0]

	for (const entry of statEntries) {
		const stats = entry.stats
		const nullStats = nullEntry.stats

		const $chart = generateChart(entry)
		const $entry = document.createElement("div")
		const $header = document.createElement("h2")
		const $table = document.createElement("table")

		$entry.className = "entry"

		$header.textContent = entry.name

		$table.append(
			metricRow("Mean (raw)", `${serializeRate(stats.mean, "op")}`),
			metricRow("Median (raw)", `${serializeRate(stats.median, "op")}`),
			metricRow("Expected (raw)", `${serializeRate(stats.expMin, "op")} to ${serializeRate(stats.expMax, "op")}`),
			metricRow("Range (raw)", `${serializeRate(stats.min, "op")} to ${serializeRate(stats.max, "op")}`),
			metricRow("Confidence interval (raw)", `${serializeRate(stats.confidenceMin, "op")} to ${serializeRate(stats.confidenceMax, "op")}`)
		)

		if (entry !== nullEntry) {
			$table.append(
				metricRow("Mean (null-adjusted)", `${serializeRate(stats.mean - nullStats.mean, "op")}`),
				metricRow("Median (null-adjusted)", `${serializeRate(stats.median - nullStats.median, "op")}`),
				metricRow("Expected (null-adjusted)", `${serializeRate(stats.expMin - nullStats.expMax, "op")} to ${serializeRate(stats.expMax - nullStats.expMin, "op")}`),
				metricRow("Range (null-adjusted)", `${serializeRate(stats.min - nullStats.max, "op")} to ${serializeRate(stats.max - nullStats.min, "op")}`),
				metricRow("Confidence interval (null-adjusted)", `${serializeRate(stats.confidenceMin - nullStats.confidenceMax, "op")} to ${serializeRate(stats.confidenceMax - nullStats.confidenceMin, "op")}`)
			)
		}

		$table.append(
			metricRow("Margin of error", `${serializeTime(stats.moe)}/op`),
			metricRow("Sample count", `${serializeNumber(stats.n)}`),
			metricRow("Population size", `${serializeNumber(stats.pop)}`)
		)

		$entry.append($header, $chart, $table)
		$root.append($entry)
	}

	document.body.append($root)
}
