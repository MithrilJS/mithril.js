/*
Rolling my own benchmark system, so I can minimize overhead and have something actually maintained.

Things it does better than Benchmark.js:

- It uses an exposed benchmark loop, so I can precisely control inter-frame delays.
- It prints out much more useful output: a confidence interval-based range and a total run count.
- It works around the low resolution inherent to modern browsers.

/* global performance */

// Note: this should be even. Odd counts will be rounded up to even.
const initSamples = 10
const minSamples = 40
const minDuration = 500
const maxDuration = 5000
const minConfidence = 0.98
// I don't feel like doing the calculus, so I've used a confidence interval table for this.
// (They're ridiculously easy to find.)
const criticalValueForMinConfidence = 2.33

// I want some level of resolution to be able to have reasonable results. 2ms can still be remotely
// useful, but Firefox's reduced fingerprinting preference clamping of 100ms is far too high.
const minResolutionTolerable = 2

let secondMax = 0
let max = 0
let min = Infinity

// Try for 100 samples and dispose the highest if it's considerably higher than the second highest.
for (let i = 0; i < 100; i++) {
	const start = performance.now()
	let diff = 0
	while (diff <= 0) {
		diff = performance.now() - start
	}
	if (max > minResolutionTolerable && diff > minResolutionTolerable) {
		throw new Error("Resolution is too coarse to be useful for measurement")
	}
	if (secondMax < max) secondMax = max
	if (max < diff) max = diff
	if (min > diff) min = diff
}

if (min > 0.999) {
	console.log(`Timer resolution detected: ${min > 999 ? min : min.toPrecision(3)}ms`)
} else if (min > 0.000999) {
	console.log(`Timer resolution detected: ${(min * 1000).toPrecision(3)}µs`)
} else {
	console.log(`Timer resolution detected: ${Math.round(min * 1000000)}ns`)
}

// Give me at least 15 units of resolution to be useful.
const minDurationPerPass = min * 15

// Uses West's weighted variance algorithm for computing variance. Each duration sample is given the.
// Ref: https://doi.org/10.1145%2F359146.359153

class BenchState {
	constructor(minSamples, minDuration, maxDuration, minConfidence) {
		if (minSamples < 2) {
			throw new RangeError("At least two samples are required to compute variance.")
		}

		// Convert the confidence into a critical value for fast margin of error comparison.

		/** @private */ this._minSamples = minSamples
		/** @private */ this._minDuration = minDuration
		/** @private */ this._maxDuration = maxDuration
		/** @private */ this._minConfidence = minConfidence

		/** @private */ this._testStart = performance.now()
		/** @private */ this._multi = 0
		/** @private */ this._start = 0

		/** @private */ this._mean = 0
		/** @private */ this._count = 0
		/** @private */ this._wsum2 = 0
		/** @private */ this._s = 0
	}

	stats() {
		// Find the margin of error. Applies Bessel's correction as it's a frequency weight.
		const stdError = Math.sqrt(this._s / ((this._count - 1) * this._count))
		return {
			ticks: this._count,
			mean: this._mean,
			marginOfError: stdError * criticalValueForMinConfidence,
		}
	}

	done() {
		const count = this._count
		if (count < this._minSamples) return false
		const duration = performance.now() - this._testStart
		if (duration >= this._maxDuration) return true
		if (duration < this._minDuration) return false
		// Find the margin of error. Applies Bessel's correction as it's a frequency weight.
		const stdError = Math.sqrt(this._s / ((count - 1) * count))
		const marginOfError = stdError * criticalValueForMinConfidence
		return marginOfError / this._mean >= this._minConfidence
	}

	start() {
		this._start = performance.now()
		this._multi = 0
	}

	tick() {
		let sample = performance.now() - this._start
		this._multi++
		if (sample < minDurationPerPass) return false

		const weight = this._multi
		const meanOld = this._mean
		sample /= weight
		this._count += weight
		this._wsum2 += weight * weight
		this._mean = meanOld + (weight / this._count) * (sample - meanOld)
		this._s += weight * (sample - meanOld) * (sample - this._mean)
		return true
	}
}

/**
 * @param {{[key: string]: (state: BenchState) => void | PromiseLike<void>}} tests
 */
export async function runBenchmarks(tests) {
	const testCount = Object.keys(tests).length

	console.log(`${testCount} test${testCount === 1 ? "" : "s"} loaded`)

	const start = performance.now()

	// Minimize sample count within the warm-up loop, so ICs receive the right runtime
	// information.
	let failed = false

	for (let i = 0; i < initSamples; i += 2) {
		for (const [name, test] of Object.entries(tests)) {
			try {
				await test(new BenchState(2, 0, Infinity, 0))
			} catch (e) {
				failed = true
				console.error(`Error while warming up ${name}:`)
				console.error(e)
			}
		}
	}

	if (failed) return

	console.log("Tests warmed up")

	for (const [name, test] of Object.entries(tests)) {
		const state = new BenchState(minSamples, minDuration, maxDuration, minConfidence)
		// Let errors here crash the benchmark.
		await test(state)
		const {mean, marginOfError, ticks} = state.stats()

		const min = mean - marginOfError
		const max = mean + marginOfError

		const maxOps = Math.floor(1000 / min).toLocaleString(undefined, {useGrouping: true})
		const minOps = Math.floor(1000 / max).toLocaleString(undefined, {useGrouping: true})

		let minDisplay = min
		let maxDisplay = max
		let unit = "ms"

		if (maxDisplay < 1) {
			minDisplay *= 1000
			maxDisplay *= 1000
			unit = "µs"
			if (maxDisplay < 1) {
				minDisplay *= 1000
				maxDisplay *= 1000
				unit = "ns"
			}
		}

		minDisplay = minDisplay.toPrecision(3)
		maxDisplay = maxDisplay.toPrecision(3)

		const timeSpan = minDisplay === maxDisplay ? minDisplay : `${minDisplay}-${maxDisplay}`
		const opsSpan = minOps === maxOps ? minOps : `${minOps}-${maxOps}`

		console.log(`${name}: ${timeSpan} ${unit}/op, ${opsSpan} op/s, n = ${ticks.toLocaleString()}`)
	}

	const end = performance.now()

	console.log(`Test completed in ${Math.round((end - start) / 1000)}s`)
}
