/** @type {Array<{count: number, sum: number}>} */
const samples = []
let ticks = 0
let minSamples = 0
let minDuration = 0
let maxDuration = 0
let minConfidence = 0
let meanSum = 0

/** @param {import("./bench.js").BenchOptions} options */
export function resetStats(options) {
	samples.length = 0
	ticks = 0
	minSamples = options.minSamples
	minDuration = options.minDuration
	maxDuration = options.maxDuration
	minConfidence = options.minConfidence
	meanSum = 0
}

// Returns the population mean. The population mean is what you get when you take all the
// samples and multiply them by their probabilities.
//
// We don't have all the samples here, and for some, there's a lot of holes, possibly thousands
// of them per sample. Fortunately, math comes to the rescue, letting us not try to impute all
// that missing data.
//
// - The probability of each tick is literally just `P(v) = 1 / N`, where `N` is the total
//   number of ticks.
// - Each sample represents a group of ticks that sums up to `value`, giving us a formula of
//   `value = sum(0 <= i < N: x[i])`.
// - The population mean is the sample sum weighted by its probability. For this, the formula
//   would be `mean = sum(0 <= i < N: x[i]) * P(x[i])`. Substituting `P(v)` in, that becomes
//   `mean = sum(0 <= i < N: x[i] / N)`. This happens to be precisely the arithmetic mean.
// - The whole mean is `mean = sum(0 <= j < N: y[j] * P(y[j]))`, or as per above,
//   `mean = sum(0 <= j < N: y[j] / N)`. This also is the same as the arithmetic mean of the
//   inner data.
// - Merging unweighted arithmetic means (like the two above) together is very simple: take a
//   weighted arithmetic mean of the means, with their weights being their sample counts.
//
// So, the population mean is just that weighted arithmetic mean. Or, in other words, where `s`
// is the list of samples:
//
// ```
// weightSum = sum(0 <= i < count(s): count(s[i]))
//           = N
// weight(v) = count(v) / weightSum
// mean = sum(0 <= i < count(s): sum(s[i]) * weight(s[i])) / N
// ```
//
// That of course can be optimized a bit, and it's what this formula uses:
//
// ```
// mean = sum(0 <= i < count(s): sum(s[i]) * count(s[i])) / (N^2)
// ```
//
// Note that the above sum is built incrementally in `pushSample`. It's not generated here in this
// function - this function's intentionally cheap.
function mean() {
	return meanSum / (ticks * ticks)
}

/**
 * @param {number} count
 * @param {number} sum
 * @param {number} duration
 */
export function pushSample(count, sum, duration) {
	// Performs binary search to find the index to insert into. After the loop, the number of
	// elements greater than the value is `sampleCount - R`, and the number of elements less or
	// equal to the value is `R`. `R` is thus the index we want to insert at, to retain
	// insertion order while still remaining sorted.

	/* eslint-disable no-bitwise */

	let L = 0
	let R = samples.length

	while (L < R) {
		// eslint-disable-next-line no-bitwise
		const m = (L >>> 1) + (R >>> 1) + (L & R & 1)
		if (samples[m].sum / samples[m].count > sum / count) {
			R = m
		} else {
			L = m + 1
		}
	}

	/* eslint-enable no-bitwise */

	// Avoid the overhead of `.splice`, since that creates an array. I don't want to trust the
	// engine's ability to elide the allocation. The test operation could potentially mess with
	// that.

	const sample = {count, sum}
	const prevLen = samples.length
	// Ensure the engine can only see the sample array as a dense sample object array.
	samples.push(sample)
	samples.copyWithin(R + 1, R, prevLen)
	samples[R] = sample

	ticks += count
	meanSum += sum * count

	if (samples.length >= minSamples) {
		if (duration >= maxDuration) return true
		if (duration >= minDuration) {
			if (marginOfError() / mean() >= minConfidence) return true
		}
	}

	return false
}

// The quantile is required for the margin of error calculation and the median both, and it's
// pretty easy to compute when all samples are known:
//
// ```
// i = q * count(s)
// j = floor(i)
// k = ceil(i)
// quantile[q] = s[i],                            if j = k
//             = s[j] * (i - j) + s[k] * (k - i), if j ≠ k
// ```
//
// We don't have all samples, so we're estimating it through linear interpolation. Each sample
// value is treated as a midpoint, and the count is the span the midpoint covers. Given a sample
// list of `{count: 1, mean: 0.5}, {count: 3, mean: 1}, {count: 2, mean: 2}`, we'll have a domain
// from 0 inclusive to 6 exclusive. (In reality, the values are stored as `mean * count`, not as
// `mean` directly. But means are easier to explain here) Here's a graph of this list, with each
// span's midpoints:
//
//   +-----------------------------------+
//   |                                   |
// 2 |                       +-----*-----|
//   |                                   |
//   |                                   |
//   |                                   |
// 1 |     +--------*--------+           |
//   |                                   |
//   |--*--+                             |
//   |                                   |
// 0 +-----------------------------------+
//   0     1     2     3     4     5     6
//
// What we're actually calculating is the linear interpolation of the midpoints. At the edges,
// we'll extrapolate the previous line to the sides. Samples are always sorted by value, so this
// is safe and will never be negative on the right side.
//
//   +-----------------------------------+
//   |                                _-¯|
// 2 |                            _*¯    |
//   |                        _-¯        |
//   |                    _-¯            |
//   |                _-¯                |
// 1 |            _ *¯                   |
//   |      _ - ¯                        |
//   |  * ¯                              |
//   |                                   |
// 0 +-----------------------------------+
//   0     1     2     3     4     5     6
//
// Suppose we're looking for a quantile of 0.5, the estimated median. That would reside at offset
// 3. The midpoints we'd be interpolating are (2.5, 1) and (5, 2), giving us a segment span of 3.5.
// Interpolating this gives us a formula of `1*((3-2.5)/3.5)+2*((5-3)/3.5)`, which comes out to
// 9/7 or about 1.2857142857142856.
//
//   +-----------------------------------+
//   |                                _-¯|
// 2 |                            _*¯    |
//   |                        _-¯        |
//   |                    _-¯            |
//   |                _@¯                |
// 1 |            _ *¯                   |
//   |      _ - ¯                        |
//   |  * ¯                              |
//   |                                   |
// 0 +-----------------------------------+
//   0     1     2     3     4     5     6
//
// Suppose we're looking for a quantile of 0.98 instead. That would reside at offset 0.98*6 = 5.88,
// exceeding the midpoint (5) of the last span (4 to 6). In this case, we need to take the last two
// points, (2.5, 1) and (5, 2), and extrapolate the line they form out to x=5.88.
//
//   +-----------------------------------+
//   |                                _-@|
// 2 |                            _*¯    |
//   |                        _-¯        |
//   |                    _-¯            |
//   |                _-¯                |
// 1 |            _ *¯                   |
//   |      _ - ¯                        |
//   |  * ¯                              |
//   |                                   |
// 0 +-----------------------------------+
//   0     1     2     3     4     5     6
//
// The slope between those two points is `m=(2-1)/(5-2.5)`, or 0.4. We could plug this into
// point-slope form and get an equation right away, but we need a direct formula for `y` in terms
// of `x` for the code, so we need to solve for that.
//
// ```
// y = m*x+c       <- What we want
// y-y1 = m*(x-x1) <- What we have
// y = m*(x-x1)+y1 <- We can use this as our formula
// ```
//
// Our `(x1, y1)` can be either (2.5, 1) or (5, 2), doesn't matter. Applying this formula using the
// point (5, 2) comes out to exactly 2.352.
//
// How does this translate to code? Well, each count is a relative offset from the previous index.
// We need to scan and do an incremental sum. The span start value is the sum before adding the
// count, and the span end is the sum after adding the count. This below generates all the
// coordinates.
//
// ```
// let sum = 0
// for (const sample of samples) {
//     const start = sum
//     const end = sum + getCount(sample)
//     const value = getValue(sample)
//     const coordinate = {x: (end + start) / 2, y: value}
//
//     sum += getCount(sample)
// }
// ```
//
// To do the interpolation, we need to track the previous coordinate.
//
// ```
// let lastCoordinate
// // ...
// for (const sample of samples) {
//     // ...
//     lastCoordinate = coordinate
// }
// ```
//
// If the target X value equals the coordinate, it's the coordinate's value.
//
// ```
// const targetX = Q * ticks
// // ...
// for (const sample of samples) {
//     // ...
//     if (coordinate.x === targetX) return coordinate.y
//     // ...
// }
// ```
//
// If the target X value is within the span between the current and previous coordiate, we perform
// linear interpolation.
//
// ```
// const targetX = Q * ticks
// let lastCoordinate = {x: NaN, y: NaN}
// // ...
// for (const sample of samples) {
//     // ...
//     if (coordinate.x > targetX) {
//         const dx = coordinate.x - lastCoordinate.x
//         return lastCoordinate.y * ((targetX - lastCoordinate.x) / dx) +
//             coordinate.y * ((coordinate.x - targetX) / dx)
//     }
//     // ...
// }
// ```
//
// To do the right extrapolation, we need to track the two previous coordinates. Using the last two
// coordinates, we compute the slope and perform linear extrapolation. (Left extrapolation is
// similar, but I'm omitting it for brevity.)
//
// ```
// const targetX = Q * ticks
// let secondLastCoordinate
// // ...
// for (const sample of samples) {
//     secondLastCoordinate = lastCoordinate
//     // ...
// }
//
// const m = (lastCoordinate.y - secondLastCoordinate.y) /
//     (lastCoordinate.x - secondLastCoordinate.x)
// return m * (targetX - lastCoordinate.x) + lastCoordinate.y
// ```
//
// Put all together, it looks like this. The actual code differs, but that's due to three things:
// samples are stored and accessed differently than the above code, it also implements the left
// extrapolation, and I've added a few small optimizations to things like operation order.
//
// ```
// const targetX = Q * ticks
// let lastCoordinate = {x: NaN, y: NaN}
// let secondLastCoordinate
// let sum = 0
// for (const sample of samples) {
//     const start = sum
//     const end = sum + getCount(sample)
//     const value = getValue(sample)
//     const coordinate = {x: (end + start) / 2, y: value}
//
//     if (coordinate.x === targetX) return coordinate.y
//     if (lastCoordinate.x < targetX) {
//         const dx = coordinate.x - lastCoordinate.x
//         return lastCoordinate.y * ((targetX - lastCoordinate.x) / dx) +
//             coordinate.y * ((coordinate.x - targetX) / dx)
//     }
//
//     secondLastCoordinate = lastCoordinate
//     lastCoordinate = coordinate
//
//     sum += getCount(sample)
// }
//
// const m = (lastCoordinate.y - secondLastCoordinate.y) /
//     (lastCoordinate.x - secondLastCoordinate.x)
// return m * (targetX - lastCoordinate.x) + lastCoordinate.y
// ```
/** @param {number} Q */
function quantile(Q) {
	if (Q <= 0) {
		throw new RangeError("Quantile is undefined for Q <= 0")
	}
	if (Q >= 1) {
		throw new RangeError("Quantile is undefined for Q >= 1")
	}
	if (samples.length < 2) {
		throw new RangeError("Quantile is undefined for N < 2")
	}

	const targetX = Q * ticks
	let lastX1 = NaN
	let lastY1 = NaN
	let lastX2 = NaN
	let lastY2 = NaN
	let sum = 0
	let extrapolateBack = false

	for (const sample of samples) {
		const x1 = lastX1 = lastX2
		const y1 = lastY1 = lastY2
		const start = sum
		const end = sum + sample.count
		const x2 = lastX2 = (end + start) / 2
		const y2 = lastY2 = sample.sum / sample.count

		sum = end

		if (x2 === targetX) return y2
		if (x2 > targetX) {
			// Interval: x1 <= targetX < x2
			// Interpolate from (x1, y1) to (x2, y2)
			// eslint-disable-next-line no-self-compare
			if (x1 === x1) {
				const dx = x2 - x1
				return (y1 / dx) * (targetX - x1) + (y2 / dx) * (x2 - targetX)
			}
			// Interval: 0 <= targetX < first coordinate's X
			// Extrapolate the line (x1, y1) to (x2, y2) backwards to targetX
			if (extrapolateBack) break
			extrapolateBack = true
		}
	}

	// Interval: last coordinate's X <= targetX < N
	// Extrapolate the line (lastX1, lastY1) to (lastX2, lastY2) out to targetX
	return (lastY2 - lastY1) / (lastX2 - lastX1) * (targetX - lastX2) + lastY2
}

// Returns the (estimated) population variance.
//
// The population variance (squared population standard deviation) is very simple: take
// each sample, subtract each one by the mean, and take the mean of the squares of those
// differences. The general formula for that is this:
//
// ```
// variance = sum(0 <= i < N: (x[i] - mean)^2) / N
// ```
//
// Unfortunately, we don't have all the samples. So we need to use an alternate formula to
// estimate it (and apply Bessel's correction as the weights are frequency weights).
//
// ```
// variance = sum(0 <= i < count(s): count(s[i]) * (avg(s[i]) - mean)^2) /
//            (sum(0 <= i < count(s): count(s[i])) - 1)
//          = sum(0 <= i < count(s): count(s[i]) * (avg(s[i]) - mean)^2) / (N - 1)
//          = sum(0 <= i < count(s): count(s[i]) * (sum(s[i]) / count(s[i]) - mean)^2) / (N - 1)
// ```
function variance() {
	if (samples.length < 2) {
		throw new RangeError("Variance is undefined for N < 2")
	}

	if (ticks < 2) {
		throw new RangeError("Variance is undefined for population < 2")
	}

	const m = mean()
	let sum = 0

	for (const sample of samples) {
		const delta = sample.sum / sample.count - m
		sum += sample.count * delta * delta
	}

	return sum / (ticks - 1)
}

// Returns the margin of error, with finite population correction applied.
//
// The formula for the finite population correction is this, where `n` is the sample count:
//
// ```
// FPC = sqrt((N - n) / (N - 1))
// ```
//
// It's needed because it's quite common that the number of samples is pretty close to the
// total population count. Only in very fast tests is it not.
//
// The margin of error formula is this, where `0 <= q <= 1`:
//
// ```
// MOE[q] = quantile[q] * sqrt(variance / N) * FPC
// ```
//
// (The quantile function is computed using a separate helper function.)
//
// These two calculations can be combined, since `sqrt(a) * sqrt(b) = sqrt(a * b)`.
//
// ```
// MOE[q] = quantile[q] * sqrt(variance / N) * sqrt((N - n) / (N - 1))
//        = quantile[q] * sqrt((variance / N) * (N - n) / (N - 1))
//        = quantile[q] * sqrt((variance * (N - n)) / (N * (N - 1)))
// ```
function marginOfError() {
	return quantile(minConfidence) * Math.sqrt(
		(variance() / ticks) *
		((ticks - samples.length) / (ticks - 1))
	)
}

export function currentDisplayStats() {
	return {
		pop: ticks,
		n: samples.length,
		moe: marginOfError(),
		mean: mean(),
		median: quantile(0.5),
		min: samples[0].sum / samples[0].count,
		max: samples[samples.length - 1].sum / samples[samples.length - 1].count,
		confidenceMin: quantile(1 - minConfidence),
		confidenceMax: quantile(minConfidence),
		expMin: quantile(0.3173),
		expMax: quantile(0.6827),
	}
}

export function getSamples() {
	return samples.slice()
}
