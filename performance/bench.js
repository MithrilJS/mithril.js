// See the README for some details about the design of this.

/* global performance */

import {currentDisplayStats, getSamples, pushSample, resetStats} from "./stats.js"
import {serializeNumber, serializeRate, serializeTime} from "./serialized.js"
import {renderCompleted} from "./chart.js"

// Note: this should be even. Odd counts will be rounded up to even.
const initSamples = 50

// Don't want to wait all day for this if the browser has some sort of bug or if the system's too
// loaded. This comes out to a minimum frame rate of 1 FPS - not even E-ink displays under heavy
// load are normally that slow.
//
// As the frame initialization loop waits for 100 samples, this enforces an upper bound of 20
// seconds.
//
// Browsers do throttle their tests when de-focused, though, so this may trip in those cases.
const maxFrameDeltaTolerable = 1000

// I want some level of resolution to be able to have reasonable results. 2ms can still be remotely
// useful, but Firefox's reduced fingerprinting preference clamping of 100ms is far too high.
const minResolutionTolerable = 2

const runtimeMinSamples = 100
const runtimeMinDuration = 1000
const runtimeMaxDuration = 5000
const runtimeMinConfidence = 0.99
// Give me at least 15 units of granularity per tick, to avoid risking precision issues.
const runtimeMinGranularityUnitsPerTick = 15

async function checkResolution(sampleCount, assumedQuantile, maxTolerable, errorTemplate, fetchSample) {
	if (Math.log10(sampleCount - 1) % 1 !== 0) {
		throw new Error("Expected sample count to be one greater than a power of 10")
	}

	const samples = new Float64Array(sampleCount)
	maxTolerable = Number(maxTolerable)
	errorTemplate = `${errorTemplate}`
	let size = 0

	for (;;) {
		const sample = await fetchSample()
		if (sample > maxTolerable) {
			throw new RangeError(errorTemplate.replace("%", sample))
		}

		samples[size++] = sample
		if (size === samples.length) {
			samples.sort()

			const max = size - 1

			return {
				min: samples[0],
				max: samples[max],
				median: samples[max * 0.5],
				assumed: samples[Math.round(max * assumedQuantile)],
			}
		}
	}
}

function getTimerGranularity() {
	return checkResolution(
		1001,
		// Grab the 90th percentile to base the granularity on, as that should reasonably
		// represent the worst case in practice.
		0.9,
		minResolutionTolerable,
		"Resolution of % ms is too coarse to be useful for measurement.",
		() => {
			const start = performance.now()
			let diff = 0
			while (diff <= 0) {
				diff = performance.now() - start
			}
			return diff
		}
	)
}

function nextFrame() {
	return new Promise((resolve) => requestAnimationFrame(resolve))
}

async function getFrameInterval() {
	if (typeof requestAnimationFrame !== "function") return
	let storedTimestamp = await nextFrame()
	return checkResolution(
		// Only wait for 100 frames.
		// - 240Hz comes out to about 0.41 seconds
		// - 144Hz comes out to about 0.69 seconds
		// - 60Hz comes out to about 1.67 seconds
		// - 30Hz comes out to about 3.33 seconds
		101,
		// Grab the 10th percentile to base the interval on, as that should reasonably
		// represent the worst case in practice.
		0.1,
		maxFrameDeltaTolerable,
		"Frame delta of % ms will take too long to initialize with.",
		async () => {
			const prev = storedTimestamp
			const next = storedTimestamp = await nextFrame()
			return next - prev
		}
	)
}

// Uses West's weighted variance algorithm for computing variance. Each duration sample is given the.
// Ref: https://doi.org/10.1145%2F359146.359153

/**
 * @typedef BenchSpec
 * @property {() => void} [tick]
 * This is run before each tick loop.
 * @property {() => void} fn
 * This is the test being benchmarked.
 */

/**
 * @typedef BenchOptions
 * @property {number} minSamples
 * @property {number} minDuration
 * @property {number} maxDuration
 * @property {number} minConfidence
 * @property {number} minDurationPerPass
 */

// To serve as a black hole for benchmarks, with as little overhead as pragmatically possible.
// Gets added and immediately removed from the `performance` global at the very end, but prevents
// the function body from being able to develop an IC to remove its result.
const benchResultSym = Symbol()
let benchResult

/**
 * @param {BenchSpec} spec
 * @param {BenchOptions} options
 */
async function runSpec({tick, fn}, options) {
	if (options.minSamples < 2) {
		throw new RangeError("At least two samples are required to compute variance.")
	}

	const testStart = performance.now()
	resetStats(options)
	const minDurationPerPass = options.minDurationPerPass

	for (;;) {
		if (typeof tick === "function") {
			tick()
		}

		// Yield for I/O and give an opportunity for GC. Also, in browsers, give a chance for the
		// frame to render.
		await nextFrame()

		const start = performance.now()
		let multi = 0
		let sample, now

		do {
			benchResult = fn()
			now = performance.now()
			multi++
		} while ((sample = now - start) < minDurationPerPass)

		if (pushSample(multi, sample, now - testStart)) return
	}
}

/**
 * @param {{[key: string]: BenchSpec}} tests
 */
async function runSpecs(tests) {
	const start = performance.now()

	// Options must be passed in the query string in browsers (like `?print-raw`) and passed via a
	// command line argument in Node and Deno.
	//
	// (Why add Deno compatibility? Just a bit of future proofing, that's all.)

	const testCount = Object.keys(tests).length

	console.log(`${testCount} test${testCount === 1 ? "" : "s"} loaded`)

	const granularity = await getTimerGranularity()

	console.log(
		"Timer resolution detected:" +
		`\n- min: ${serializeRate(granularity.min, "tick")}` +
		`\n- max: ${serializeRate(granularity.max, "tick")}` +
		`\n- median: ${serializeRate(granularity.median, "tick")}` +
		`\n- assumed: ${serializeRate(granularity.assumed, "tick")}`
	)

	const frameInterval = await getFrameInterval()

	if (frameInterval) {
		console.log(
			"Frame interval detected:" +
			`\n- min: ${serializeRate(frameInterval.min, "frame")}` +
			`\n- max: ${serializeRate(frameInterval.max, "frame")}` +
			`\n- median: ${serializeRate(frameInterval.median, "frame")}` +
			`\n- assumed: ${serializeRate(frameInterval.assumed, "frame")}`
		)
	}

	/** @type {BenchOptions} */
	const options = {
		minSamples: 2,
		minDuration: 0,
		maxDuration: 0,
		minConfidence: 0,
		minDurationPerPass: 0,
	}

	/** @type {Array<[string, BenchSpec]>} */
	const specList = [
		["*** null test ***", {
			tick() {},
			fn: () => "test",
		}],
		...Object.entries(tests),
	]

	// Adjust their names for easier debugging of errors
	for (const [name, spec] of specList) {
		if (typeof spec.tick === "function") {
			Object.defineProperty(spec.tick, "name", {value: `${name} (tick)`})
		}
		Object.defineProperty(spec.fn, "name", {value: name})
	}

	// Minimize sample count within the warm-up loop, so ICs receive the right runtime
	// information.
	const failed = new Set()

	for (let i = 0; i < initSamples; i += 2) {
		for (const entry of specList) {
			if (failed.has(entry)) continue
			try {
				await runSpec(entry[1], options)
			} catch (e) {
				failed.add(entry)
				console.error(e)
			}
		}
	}

	if (failed.size) return

	// Update the options in-place, so they can retain the same shape and not cause `runSpec` to
	// recompile.
	options.minSamples = runtimeMinSamples
	options.minDuration = runtimeMinDuration
	options.maxDuration = runtimeMaxDuration
	options.minConfidence = runtimeMinConfidence
	// Give me at least 15 units of granularity per tick, to avoid risking precision issues.
	options.minDurationPerPass = granularity.assumed * runtimeMinGranularityUnitsPerTick
	if (frameInterval) {
		options.minDurationPerPass = Math.max(options.minDurationPerPass, frameInterval.assumed * 0.7)
	}

	console.log(
		"Tests warmed up, starting benchmark" +
		`\n- min confidence level: ${options.minConfidence}` +
		`\n- min samples/test: ${options.minSamples}` +
		`\n- min duration/test: ${serializeTime(options.minDuration)}` +
		`\n- max duration/test: ${serializeTime(options.maxDuration)}` +
		`\n- min duration/pass: ${serializeTime(options.minDurationPerPass)}`
	)

	/** @type {import("./chart.js").StatEntry[]} */
	const statEntries = []
	let nullStats

	for (const [name, spec] of specList) {
		// Let errors here crash the benchmark.
		await runSpec(spec, options)
		const stats = currentDisplayStats()

		console.log(`[${name}]:
- mean: ${serializeRate(stats.mean, "op")}
- median: ${serializeRate(stats.median, "op")}
- expected: ${serializeRate(stats.expMin, "op")} to ${serializeRate(stats.expMax, "op")}
- range: ${serializeRate(stats.min, "op")} to ${serializeRate(stats.max, "op")}
- CI: ${serializeRate(stats.confidenceMin, "op")} to ${serializeRate(stats.confidenceMax, "op")}${
	// Not perfect adjustment, but good enough to work as a heuristic. The non-adjusted
	// variants are the true unbiased statistics.
	!nullStats ? "" : `
- null-adjusted mean: ${serializeRate(stats.mean - nullStats.mean, "op")}
- null-adjusted median: ${serializeRate(stats.median - nullStats.median, "op")}
- null-adjusted expected: ${serializeRate(stats.expMin - nullStats.expMax, "op")} to ${serializeRate(stats.expMax - nullStats.expMin, "op")}
- null-adjusted range: ${serializeRate(stats.min - nullStats.max, "op")} to ${serializeRate(stats.max - nullStats.min, "op")}
- null-adjusted CI: ${serializeRate(stats.confidenceMin - nullStats.confidenceMax, "op")} to ${serializeRate(stats.confidenceMax - nullStats.confidenceMin, "op")}`}
- MOE: ${serializeTime(stats.moe)}/op
- N: ${serializeNumber(stats.n)}
- pop: ${serializeNumber(stats.pop)}`)

		if (statEntries) {
			statEntries.push({
				name,
				stats,
				samples: getSamples(),
			})
		}

		nullStats = stats
	}

	performance[benchResultSym] = benchResult
	delete performance[benchResultSym]

	console.log(`Benchmark run completed in ${serializeTime(performance.now() - start)}`)

	if (statEntries) {
		let result = "Sample CSVs:\n"
		for (const entry of statEntries) {
			result = `${result}>${entry.name}\ncount,sum\n`
			for (const sample of entry.samples) {
				result = `${result}${sample.count},${sample.sum}\n`
			}
		}
		console.log(result)
	}

	return statEntries
}

/**
 * @param {{[key: string]: BenchSpec}} tests
 */
export function setupBenchmarks(setup, cleanup, benchmarks) {
	async function run() {
		document.body.innerHTML = "Benchmarks in progress. Leave console closed."

		await setup()
		let completed = 0
		let statEntries
		try {
			statEntries = await runSpecs(benchmarks)
			completed++
		} finally {
			try {
				await cleanup()
				completed++
			} finally {
				document.body.innerHTML =
					`Benchmarks ${completed < 2 ? "errored" : "completed"}. See console.`

				if (statEntries) {
					renderCompleted(statEntries)
				}
			}
		}
	}

	window.addEventListener("load", run, {once: true})
}
