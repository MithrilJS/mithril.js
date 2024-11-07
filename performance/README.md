# Benchmarks

## Usage

Usage is extremely simple and designed to put the ultimate focus on the benchmark code itself:

```js
import {setupBenchmarks} from "./bench.js"

async function setup() {
	// Test suite setup. May be async.
}

async function cleanup() {
	// Post-benchmark cleanup. May be async and always performed, even on error.
}

await setupBenchmarks(setup, cleanup, {
	"foo": {
		// Before every measurement interval. `fn` may be called multiple times in a single
		// interval, so be aware.
		tick() {
			// ...
		},
		// The actual benchmarked code. Be sure to return a result so it doesn't get optimized out.
		fn() {
			// ...
		},
	},
})
```

Then, make sure the script is loaded in an HTML file like follows:

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<title>Performance tests</title>
		<script src="test-perf.js" type="module"></script>
	</head>
	<body>
		Initializing tests. If this text doesn't change, open the browser console and check for
		load errors.
	</body>
</html>
```

To run the benchmarks:

1. Spin up a server using `node scripts/server.js` in the repo root.
2. Open <https://localhost:8080/performance/index.html> or whatever the path to your benchmark is.
3. Run the tests and wait for them to complete. They'll then show a bunch of benchmark graphs for detailed inspection. If you want a simpler view without all the graphs or if you just want to copy all the samples out, open the console.

## Rationale

Why are we using a home-rolled system instead of a pre-made framework? Two reasons:

1. It won't have maintenance problems. If there's an issue with the benchmark, it can be patched in-repo.
2. I can better account for overhead.
3. It correctly accounts for timer accuracy problems.

Things it does better than Benchmark.js:

- It uses an exposed benchmark loop, so I can precisely control inter-frame delays.
- It prints out much more useful output: a confidence interval-based range and a total run count.
- It works around the low resolution inherent to modern browsers.

Before I go further, I'd like to explain some theory, theory that might not be obvious to most.

### What timers actually measure

Timers do *not* measure raw intervals directly. They simply measure the number of clock ticks that
have occurred since a given point of time. What benchmarks actually do when they compare two
timestamps is count the number of clock ticks that occurred between them.

Operating systems hide this low-level detail by exposing a monotonic "clock". This clock is based
on two things: a CPU cycle counter and the CPU's current frequency. It optionally can also track
system sleep time using a built-in counter (usually plugged into a small quartz crystal). "Sleep"
here just means the CPU is in a low-power state, clock disabled, while waiting for either I/O or a
hardware timer to go off, not that the system itself is physically powered off. While it's useful
to expose this as a duration offset (usually relative to some point during the boot process), this
is only an abstraction.

### Browser interactions

Browsers, for privacy and security reasons, limit the granularity of timers.

- https://w3c.github.io/hr-time/#dfn-coarsen-time
- https://github.com/w3c/hr-time/issues/79
- https://github.com/w3c/hr-time/issues/56

The spec requires a mandatory maximum of 20 microseconds of granularity for isolated frames, but
some browsers coarsen the timers even further:

- Firefox: 20 microseconds
- Chrome: 100 microseconds with 100 microseconds jitter
- Safari: 1000 microseconds
- Edge pre-Chromium: 20 microseconds with 20 microseconds jitter
- Brave: 100 microseconds

Once again, keep in mind, the monotonic clock is an abstraction. What this clock coarsening does
isn't directly reducing resolution. What it really does from a theoretical perspective is establish
a different kind of tick, one that's closer to that of a wall clock's ticking. It creates a clock
that ticks at the granularity interval, but relies on the OS's CPU frequency tracking to detect if
it's supposed to tick. (In practice, instead of having the OS directly manage that in memory, it
instead uses a mathematical formula to derive it. And this is also how it's actually specified.)

The induced jitter some browsers use mean that there's some uncertainty, a chance the clock may
wait up to that long to tick. For instance, Chrome's clock may wait anywhere from 100 to 200
microseconds to generate a tick.

So, in reality, comparing times between two `performance.now()` calls is simply counting the number
of times the clock ticked. Or to put it another way, you could assume it's really doing something like this pseudocode, assuming no jitter:

```js
// Firefox in isolated contexts
const resolution = 0.02 // milliseconds

let ticks = 0

spawnThread(() => {
	while (true) {
		sleepMs(resolution)
		ticks++
	}
})

performance.now = () => {
	return ticks * resolution
}
```

> For performance reasons, it doesn't work like this in browsers, but you get the point. And it very much *does* work this way at the hardware and OS level.

Jitter is more involved, as you'd need partial ticks. But it otherwise works similarly:

```js
// Chrome in isolated contexts
const resolution = 0.1 // milliseconds
const jitter = 0.1 // milliseconds

let ticks = 0

spawnThread(() => {
	while (true) {
		const jitterAmount = Math.random()
		const jitterTicks = (resolution / jitter) * jitterAmount
		sleepMs(resolution + jitter * jitterAmount)
		ticks += 1 + jitterTicks
	}
})

performance.now = () => {
	return ticks * resolution
}
```

### How the coarseness impacts accuracy

Durations in tests are usually measured like this:

```js
const start = performance.now()
// ...
const end = performance.now()
const duration = end - start
```

Suppose resolution for the clock is 100 microseconds, and the span between the two calls is precisely 550 microseconds. You might expect to get a `duration` of `0.5` or `0.6` as that's the rounded duration. But this isn't necessarily the case, not with jitter involved. Let's go back to the timer-as-ticking-clock model to see how this could wildly differ.

1. Get `start`. For the sake of example, let's let the tick be 10, resulting in a return value of `1.0`.
2. Ticker sleeps for 100 microseconds = 1 tick. Random jitter ends up as 28 microseconds = 0.28 ticks, so after it sleeps, it would have slept for a total of 1.28 ticks.
3. Ticker sleeps for 100 microseconds = 1 tick. Random jitter ends up as 52 microseconds = 0.52 ticks, so after it sleeps, it would have slept for a total of 2.8 ticks.
4. Ticker sleeps for 100 microseconds = 1 tick. Random jitter ends up as 44 microseconds = 0.44 ticks, so after it sleeps, it would have slept for a total of 4.24 ticks.
5. Ticker sleeps for 100 microseconds = 1 tick. Random jitter ends up as 88 microseconds = 0.88 ticks, so after it sleeps, it would have slept for a total of 6.12 ticks.
6. Block completes to `end = performance.now()`. The previous ticker sleep hasn't completed, so it returns based on a tick of 10 + 4.24 = 14.24, or a return value of `1.424`.
7. `duration` evaluates to `1.424 - 1.0` = `0.42399999999999993`.

Browsers, in a quest for optimization, implement this a bit differently, and so for longer spans between successive `performance.now()` calls, you see less jitter.

```js
const resolution = 0.1 // milliseconds
const jitter = 0.1 // milliseconds

let lastTimestamp = -1

performance.now = () => {
	const rawTimestamp = getUnsafeTimestamp()
	const coarsened = Math.round(rawTimestamp / resolution) * resolution
	const coarsenedWithJitter = coarsened + Math.random() * jitter
	if (coarsenedWithJitter < lastTimestamp) return lastTimestamp
	lastTimestamp = coarsenedWithJitter
	return coarsenedWithJitter
}
```

> Chrome takes a subtly different approach (this assumes it's not cross-origin isolated, the case where it uses 100us + 100us jitter):
>
> ```js
> // This is approximate. Chrome operates on integer microseconds and uses a (weak) scrambler instead
> // of a proper (pseudo-)random number generator to compute its jitter.
>
> const resolution = 0.1 // milliseconds
> const jitter = 0.1 // milliseconds
>
> const clamperSecret = randomBigInt64()
>
> const clampedTimeOrigin = getClampedTimeOrigin()
>
> performance.now = () => {
> 	const rawTimestamp = getUnsafeTimestamp()
> 	const sign = Math.sign(rawTimestamp)
> 	const time = Math.abs(rawTimestamp)
> 	const lowerDigits = time % 10_000_000
> 	const upperDigits = time - lowerDigits
>
> 	let clampedTime = lowerDigits - lowerDigits % resolution
> 	if (lowerDigits >= jitter * Math.random()) clampedTime += jitter
> 	clampedTime = (clampedTime + upperDigits) * sign
> 	return Math.max(clampedTime - clampedTimeOrigin, 0)
> }
> ```
>
> Or, in math notation:
> - $R$ is the raw millisecond timestamp.
> - $O$ is the clamped time origin.
> - $j$ is the jitter for the returned timestamp.
> - $d$ is the result duration.
>
> $$
> \begin{align*}
> R &\in \reals \\
> j &\in [0, 1) \\
> j & \text{ is uniformly random} \\
> t &= |R| \\
> l &= t - 1000000 \left\lfloor \frac{t}{1000000} \right\rfloor \\
> d &= \text{max}\left(\text{sgn}(R)\left(t-100\left\lfloor \frac{l}{100} \right\rfloor+1_{[-\infty, l]}(0.1j)~0.1\right) - O\right) \\
> \end{align*}
> $$

In this case, the sequence would look like this:

1. Get `start`. For the sake of example, let's let the raw timestamp be `1.00` and assume the random value for the jitter comes out to `0.1`, thus giving us a return value of `1.01`.
2. System clock sleeps for sufficient nanoseconds to equal 550 microseconds.
3. Block completes to `end = performance.now()`. The raw timestamp would now be `1.55`. Let's assume the random value for the jitter is `0.8`, which would give us a value of `1.68`.
4. `duration` evaluates to `1.68-1.01` = `0.67`, representing a duration of 670 microseconds.

In theory, `duration` could go as low as `0.45` (`0.95` + max jitter start, `1.50` + min jitter end) or as high as `0.65` (`1.00` + min jitter start, `1.55` + max jitter end), or an uncertainty of 10% with this model.

Thing is, this is just with longer times between polls. In reality, we're often calling `performance.now()` multiple times in a single interval. Here's one way that could shake out with the above pseudocode, assuming the time between calls is 20 microseconds:

1. Get `start`. For the sake of example, let's let the raw timestamp be `1.00` and assume the random value for the jitter comes out to `0.1`, thus giving us a return value of `1.01`.
2. System clock sleeps for sufficient nanoseconds to equal 20 microseconds.
3. Block completes to `end = performance.now()`. The raw timestamp would now be `1.02`. Let's assume the random value for the jitter is `0.8`, which would give us a value of `1.10`.
4. `duration` evaluates to `1.10-1.01` = `0.09`, representing a duration of 100 microseconds.

Here's another way it could shake out:

1. Get `start`. For the sake of example, let's let the raw timestamp be `1.00` and assume the random value for the jitter comes out to `0.8`, thus giving us a return value of `1.08`.
2. System clock sleeps for sufficient nanoseconds to equal 20 microseconds.
3. Block completes to `end = performance.now()`. The raw timestamp would now be `1.02`. Let's assume the random value for the jitter is `0.2`, which would give us a value of `1.04`. As this is less than the previous jittered timestamp of `1.08` returned, it returns that instead.
4. `duration` evaluates to `1.08-1.08` = `0`, representing a duration of 0 microseconds.

Here's a third way it could shake out:

1. Get `start`. For the sake of example, let's let the raw timestamp be `0.94` and assume the random value for the jitter comes out to `0.2`, thus giving us a return value of `0.96`.
2. System clock sleeps for sufficient nanoseconds to equal 20 microseconds.
3. Block completes to `end = performance.now()`. The raw timestamp would now be `0.96`. Let's assume the random value for the jitter is `0.8`, which would give us a value of `1.08`.
4. `duration` evaluates to `1.08-0.96` = `0.1200000000000001`, representing a duration of 120 microseconds.

Here's a fourth way it could shake out:

1. Get `start`. For the sake of example, let's let the raw timestamp be `0.94` and assume the random value for the jitter comes out to `0.8`, thus giving us a return value of `1.02`.
2. System clock sleeps for sufficient nanoseconds to equal 20 microseconds.
3. Block completes to `end = performance.now()`. The raw timestamp would now be `0.96`. Let's assume the random value for the jitter is `0.2`, which would give us a value of `1.02`.
4. `duration` evaluates to `1.02-1.02` = `0`, representing a duration of 0 microseconds.

That's a lot of examples. So let's actually apply some statistics to it all. Given that 20 microsecond span between calls:

- `duration` is within the range `0` to `0.15000000000000002` inclusive.
- The chance that `duration === 0` is 30%
- The chance that `duration > 0.02` is about 31%. This implies the average duration must be below 0.2.
- The expected value of `duration` is 0. This is the result of taking the mean of all (the infinitely many) possible durations and weighting them all by their probabilities.

<details>
<summary>Proof for the probability claims</summary>

This is so others can verify that my math is right. Stats has admittedly never been my strong suit.

> Warning, lots of calculus.
>
> Also, note that this is using my simplified model, *not* the version Chrome uses (that is actually potentially non-monotonic).

1. Start with the function call.

	```
	const resolution = 0.1 // milliseconds
	const jitter = 0.1 // milliseconds

	let lastTimestamp = -1

	performance.now = () => {
		const rawTimestamp = getUnsafeTimestamp()
		const coarsened = Math.round(rawTimestamp / resolution) * resolution
		const coarsenedWithJitter = coarsened + Math.random() * jitter
		if (coarsenedWithJitter < lastTimestamp) return lastTimestamp
		lastTimestamp = coarsenedWithJitter
		return coarsenedWithJitter
	}

	const start = performance.now()
	const end = performance.now()
	const duration = end - start

	assert(duration === 0)
	```

2. Inline the resolution and jitter constants.

	```
	let lastTimestamp = -1

	performance.now = () => {
		const rawTimestamp = getUnsafeTimestamp()
		const coarsened = Math.round(rawTimestamp * 10) / 10
		const coarsenedWithJitter = coarsened + Math.random() / 10
		if (coarsenedWithJitter < lastTimestamp) return lastTimestamp
		lastTimestamp = coarsenedWithJitter
		return coarsenedWithJitter
	}

	const start = performance.now()
	const end = performance.now()
	const duration = end - start

	assert(duration === 0)
	```

3. Inline the `performance.now()` calls and simplify.

	```
	let start = Math.round(getUnsafeTimestamp() * 10) / 10 + Math.random() / 10
	let end = Math.round(getUnsafeTimestamp() * 10) / 10 + Math.random() / 10
	if (end < start) end = start

	const duration = end - start
	assert(duration === 0)
	```

4. Reduce to pure math and encode the call offset. $p_0$ is our probability for `duration === 0`, and $p_a$ is our probability for `duration > 0.02`.

	- $R_s$ is the raw start millisecond timestamp.
	- $R_e$ is the raw end millisecond timestamp.
	- $j_s$ is the jitter for the returned start timestamp.
	- $j_e$ is the jitter for the returned end timestamp.

	$$
	\begin{align*}
	R_s, j_s, j_e & \text{ are uniformly random} \\
	j_s, j_e &\in [0, 1] \\
	R_e &= R_s + 0.02 \\
	T_s &= \frac{\mathrm{round}(10 R_s)}{10} + \frac{j_s}{10} & \\
	    &= \frac{\mathrm{round}(10 R_s) + j_s}{10} & \\
	T_e &= \frac{\mathrm{round}(10 R_s)}{10} + \frac{j_s}{10} & \\
	    &= \frac{\mathrm{round}(10 R_s) + j_s}{10} & \\
	p_0 &= \mathrm{P}(\mathrm{max}(T_s, T_e) - T_s = 0) \\
	p_a &= \mathrm{P}(\mathrm{max}(T_s, T_e) - T_s \ge 0.02) \\
	\end{align*}
	$$

5. Simplify the inequality, simplify $\mathrm{max}(a, b)$ in each piecewise variant.

	- $\mathrm{max}(a, b) - a = 0$ simplifies to $b - a \le 0$.
	- $\mathrm{max}(a, b) - a \gt 0.02$ simplifies to $b - a \gt 0.02$.

	For readability, $v$ will represent the compared-to duration and $p_v$ refers to $p_b$ when $v=0$ and $p_a$ when $v=a$. The rest of the proof holds for both equally.

	$$
	\begin{align*}
	R_s, j_s, j_e & \text{ are uniformly random} \\
	j_s, j_e &\in [0, 1] \\
	R_e &= R_s + 0.02 \\
	T_s &= \frac{\mathrm{round}(10 R_s) + j_s}{10} & \\
	T_e &= \frac{\mathrm{round}(10 R_e) + j_e}{10} & \\
	p_0 &= \mathrm{P}(T_s - T_e \le 0) \\
	    &= 1 - \mathrm{P}(T_s - T_e \gt 0) \\
	p_a &= \mathrm{P}(T_s - T_e \gt 0.02) \\
	\end{align*}
	$$

	To simplify later steps, let $p_b = 1 - p_0$. This lets me define $p_v = \mathrm{P}(T_s - T_e \gt v)$ for $v \in \{0, 0.02\}$.

6. Inline $T_s$, $T_e$, and $R_e$ into the inequalities and simplify.

	$$
	\begin{align*}
	R_s, j_s, j_e & \text{ are uniformly random} \\
	j_s, j_e &\in [0, 1] \\
	v &\in \{0, 0.02\} \\
	p_v &= \mathrm{P} \left( \frac{\mathrm{round}(10 R_s) + j_s}{10} - \frac{\mathrm{round}(10 (R_s + 0.02)) + j_e}{10} \ge v \right) \\
	    &= \mathrm{P} \left( \frac{(\mathrm{round}(10 R_s) + j_s) - (\mathrm{round}(10 R_s + 0.2)) + j_e)}{10} \ge v \right) \\
	    &= \mathrm{P}\left((\mathrm{round}(10 R_s) + j_s) - (\mathrm{round}(10 R_s + 0.2) + j_e) \ge v \right) \\
	\end{align*}
	$$

7. Separate the rounding from the jitter combination. This makes subsequent steps clearer.

	$$
	\begin{align*}
	R_s, j_s, j_e & \text{ are uniformly random} \\
	j_s, j_e &\in [0, 1] \\
	v &\in \{0, 0.02\} \\
	p_v &= \mathrm{P}\left((\mathrm{round}(10 R_s) - \mathrm{round}(10 R_s + 0.2)) + (j_s - j_e) \ge v \right) \\
	\end{align*}
	$$

8. Split the two "round" operations into their piecewise floor and ceiling components.

	$$
	\begin{align*}
	R_s, j_s, j_e & \text{ are uniformly random} \\
	j_s, j_e &\in [0, 1] \\
	v &\in \{0, 0.02\} \\
	p_v &= P\left( \begin{cases}
		(\lfloor 10 R_s \rfloor - \lfloor 10 R_s + 0.2 \rfloor) + (j_s - j_e) \ge v& \text{if } R_s \in [0.00, 0.03) \mod 0.1 \\
		(\lfloor 10 R_s \rfloor - \lceil 10 R_s + 0.2 \rceil) + (j_s - j_e) \ge v& \text{if } R_s \in [0.03, 0.05) \mod 0.1 \\
		(\lceil 10 R_s \rceil - \lceil 10 R_s + 0.2 \rceil) + (j_s - j_e) \ge v& \text{if } R_s \in [0.05, 0.08) \mod 0.1 \\
		(\lceil 10 R_s \rceil - \lfloor 10 R_s + 0.2 \rfloor) + (j_s - j_e) \ge v& \text{if } R_s \in [0.08, 0.10) \mod 0.1 \\
	\end{cases} \right) \\
	\end{align*}
	$$

9.  Simplify the round operations by taking advantage of their domains.

	$$
	\begin{align*}
	R_s, j_s, j_e & \text{ are uniformly random} \\
	j_s, j_e &\in [0, 1] \\
	v &\in \{0, 0.02\} \\
	p_v &= P\left( \begin{cases}
		(0 - 0) + (j_s - j_e) \ge v& \text{if } R_s \in [0.00, 0.03) \mod 0.1 \\
		(0 - 1) + (j_s - j_e) \ge v& \text{if } R_s \in [0.03, 0.05) \mod 0.1 \\
		(1 - 1) + (j_s - j_e) \ge v& \text{if } R_s \in [0.05, 0.08) \mod 0.1 \\
		(1 - 0) + (j_s - j_e) \ge v& \text{if } R_s \in [0.08, 0.10) \mod 0.1 \\
	\end{cases} \right) \\
	    &= P\left( \begin{cases}
		0 + (j_s - j_e) \ge v& \text{if } R_s \in [0.00, 0.03) \mod 0.1 \\
		-1 + (j_s - j_e) \ge v& \text{if } R_s \in [0.03, 0.05) \mod 0.1 \\
		0 + (j_s - j_e) \ge v& \text{if } R_s \in [0.05, 0.08) \mod 0.1 \\
		1 + (j_s - j_e) \ge v& \text{if } R_s \in [0.08, 0.10) \mod 0.1 \\
	\end{cases} \right) \\
	    &= P\left( \begin{cases}
		(j_s - j_e) \ge v& \text{if } R_s \in [0.00, 0.03) \mod 0.1 \\
		(j_s - j_e) \ge v + 1& \text{if } R_s \in [0.03, 0.05) \mod 0.1 \\
		(j_s - j_e) \ge v& \text{if } R_s \in [0.05, 0.08) \mod 0.1 \\
		(j_s - j_e) \ge v - 1& \text{if } R_s \in [0.08, 0.10) \mod 0.1 \\
	\end{cases} \right) \\
	\end{align*}
	$$

10. Merge everything into a single unified equation of probability.

	This uses the [indicator function](https://en.wikipedia.org/wiki/Indicator_function), as signified by $1_{\text{set}}$.

	$$
	\begin{align*}
	R_s, j_s, j_e & \text{ are uniformly random} \\
	j_s, j_e &\in [0, 1] \\
	v &\in \{0, 0.02\} \\
	S &= R_s \mod 0.1 \\
	  &= \frac{10 R_s - \lfloor 10 R_s \rfloor}{10} \\
	D_v &= 1_{[0.00, 0.03) \cup [0.05, 0.08)}(S) ~ \mathrm{P}((j_s - j_e) \ge v) ~ + \\
		&\phantom{=} 1_{[0.03, 0.05)}(S) ~ \mathrm{P}((j_s - j_e) \ge v + 1) ~ + \\
		&\phantom{=} 1_{[0.08, 0.10)}(S) ~ \mathrm{P}((j_s - j_e) \ge v - 1) \\
	p_v &= P(D_v) \\
	\end{align*}
	$$

	> $D_v$ is the random condition we're checking the probability of. Easier than fighting LaTeX, and also a bit clearer that this *is* a variable, just not the actual probability.

	Using [Iverson bracket](https://en.wikipedia.org/wiki/Iverson_bracket) notation (in which $[\text{cond}]$ roughly translates to `cond ? 1 : 0` in JS and most C-like languages), it'd read more like this:

	$$
	\begin{align*}
	S =& R_s \mod 0.1 \\
	  =& \frac{10 R_s - \lfloor 10 R_s \rfloor}{10} \\
	p =& ([0.00 \le x < 0.02 \text{ or } 0.05 \le x < 0.08]) ~ \mathrm{P}((j_s - j_e) \ge 0) \\
	D_v &= [0.00 \le x < 0.02 \text{ or } 0.05 \le x < 0.08] ~ \mathrm{P}((j_s - j_e) \ge v) ~ + \\
		&\phantom{=} [0.03 \le x < 0.05] ~ \mathrm{P}((j_s - j_e) \ge v + 1) ~ + \\
		&\phantom{=} [0.08 \le x < 0.10] ~ \mathrm{P}((j_s - j_e) \ge v - 1) \\
	p_v &= P(D_v) \\
	\end{align*}
	$$

11. Figure out the probability function for $\mathrm{P}((j_s - j_e) \ge x)$.

	This is a multi-step process that involves a bit of calculus. It's used across all three components, so best to do it once.

	For the PDF of $(j_s - j_e) \ge 0$, I'll go by [this answer](https://math.stackexchange.com/a/345047) and spare you the math mess. It comes out to $f_X(t) = (1 - |t|) 1_{[-1,1]}(t)$, using the same indicator function. (The math checks out, trust me.)

	Now, we need to figure out what $P((j_s - j_e) \ge x)$ is. Fortunately, this is (almost) precisely what the [cumulative distribution function](https://en.wikipedia.org/wiki/Cumulative_distribution_function) returns. The definition of that, given a distribution function $X$, is as follows, where $f_X$ is the probability density function:

	$$
	\begin{align*}
	F_X(x) &= P(X \le x) \\
	       &= \int_{-\infty}^x f_X(t) ~ dt \\
	\end{align*}
	$$

	That looks a bit scary, but we know the probability density function for our distribution already, from before. Let's plug it in.

	$$
	F(x) = \int_{-\infty}^x (1 - |t|) ~ 1_{[-1,1]}(t) ~ dt
	$$

	Conveniently, that interval for the indicator function, $-1 \le t \le 1$, is the only interval we care about. All other values we already know aren't possible to get. Knowing that, let's tighten the range of the integral and substitute that value in. (This also avoids the need to do integration by parts.)

	$$
	\begin{align*}
	F(x) &= \int_{-1}^x (1 - |t|) ~ 1_{[-1,1]}(t) ~ dt \\
	     &= \int_{-1}^x (1 - |t|) ~ 1 ~ dt \\
	     &= \int_{-1}^x (1 - |t|) ~ dt \\
	\end{align*}
	$$

	The antiderivative of $|x|$ is $\frac{1}{2} \text{sgn}(x) x^2 + C$. But let's not try to calculate that. If you look at the graph of $1-|x|$, it's just a triangle with vertices at $(0, 1)$, $(1, 0)$, and $(-1, 0)$. (I'll leave the actual plot of this as an exercise for the reader.) It's symmetric across the $y$-axis, so in reality, we're just looking at two triangles with width and height of 1. Triangle area's just $\frac{1}{2}bh$, and so the area of each triangle is just $0.5$.

	The first is easy, but the second requires some extra work. We still don't need to fuss with complicated integrals, though.

	- If $x \le 0$, the shape is a whole triangle, with height and width equal to $1 - (-x)$, so we can just do $A = \frac{1}{2}bh = \frac{1}{2} (1+x)^2$.
	- If $x \ge 0$, we can take the area of both triangles and subtract the area of the triangle not included. This triangle has height and width $1-x$, and so we can do $A = 1 - \frac{1}{2} (1-x)^2$.
	- You can merge these two into a single formula using the indicator function and the signum function. That results in an equation of $A = 1_{[-1, 0)}(x) + \frac{1}{2} \text{sgn}(x) (1-|x|)^2$. The piecewise form is easier, though.

	Now that we have a general formula, let's plug it in:

	$$
	\begin{align*}
	F(x) &= 1_{[-1, 1]}(x) ~ (1 - 1_{[-1, 0)}(x) - \frac{1}{2} \text{sgn}(x) (1-|x|)^2) \\
	     &= 1_{[-1, 1]}(x) ~ \left( 1_{[0, 1]}(x) - \text{sgn}(x) \frac{(1-|x|)^2}{2} \right) \\
	     &= 1_{[-1, 1]}(x) ~ \text{sgn}(x) \left(\frac{x^2-2|x|+1}{2} \right) \\
	\end{align*}
	$$

	Or piecewise:

	$$
	F(x) = \begin{cases}
		\frac{(1+x)^2}{2}& \text{if } -1 \le x \lt 0 \\
		1 - \frac{(1-x)^2}{2}& \text{if } 0 \le x \le 1
	\end{cases}
	$$

	And this is our probability function for $P((j_s - j_e) \ge x) = F(x)$.

12. And finally, compute the probabilities for each $v$.

	Remember the probability value:

	$$
	\begin{align*}
	R_s, j_s, j_e & \text{ are uniformly random} \\
	j_s, j_e &\in [0, 1] \\
	v &\in \{0, 0.02\} \\
	S &= R_s \mod 0.1 \\
	D_v &= 1_{[0.00, 0.03) \cup [0.05, 0.08)}(S) ~ \mathrm{P}((j_s - j_e) \ge v) ~ + \\
		&\phantom{=} 1_{[0.03, 0.05)}(S) ~ \mathrm{P}((j_s - j_e) \ge v + 1) ~ + \\
		&\phantom{=} 1_{[0.08, 0.10)}(S) ~ \mathrm{P}((j_s - j_e) \ge v - 1) \\
	p_v &= P(D_v) \\
	\end{align*}
	$$

	First, let's substitute in $P((j_s - j_e) \ge x) = F(x)$:

	$$
	\begin{align*}
	D_v &= 1_{[0.00, 0.03) \cup [0.05, 0.08)}(S) ~ F(v) ~ + \\
		&\phantom{=} 1_{[0.03, 0.05)}(S) ~ F(v + 1) ~ + \\
		&\phantom{=} 1_{[0.08, 0.10)}(S) ~ F(v - 1) \\
	\end{align*}
	$$

	Now, let's resolve it for each $v$ and $p_v$:

	$$
	\begin{align*}
	D_b &= 1_{[0.00, 0.03) \cup [0.05, 0.08)}(S) ~ F(0) + 1_{[0.03, 0.05)}(S) ~ F(1) + 1_{[0.08, 0.10)}(S) ~ F(-1) \\
	D_a &= 1_{[0.00, 0.03) \cup [0.05, 0.08)}(S) ~ F(0.2) + 1_{[0.03, 0.05)}(S) ~ F(1.02) + 1_{[0.08, 0.10)}(S) ~ F(-0.98) \\
	\end{align*}
	$$

	Each of those $F(x)$s need evaluated:

	$$
	\begin{align*}
	F(-1) &= \frac{(1+(-1))^2}{2} \\
	      &= 0 \\
	F(-0.98) &= \frac{(1+(-0.98))^2}{2} \\
	         &= 0.0002 \\
	F(0) &= \frac{(1+0)^2}{2} \\
	     &= 0.5 \\
	F(0.02) &= 1 - \frac{(1-0.02)^2}{2} \\
	        &= 0.5198 \\
	F(1) &= 1 - \frac{(1-1)^2}{2} \\
	     &= 1 \\
	\end{align*}
	$$

	$F(1.02)$ is 0 as it's out of the range of possibilities.

	Now, to plug them in:

	$$
	\begin{align*}
	D_b &= 1_{[0.00, 0.03) \cup [0.05, 0.08)}(S) ~ 0.5 + 1_{[0.03, 0.05)}(S) ~ 1 + 1_{[0.08, 0.10)}(S) ~ 0 \\
	    &= \begin{cases}
		1& \text{if } 0.00 \le S \lt 0.03 \\
		0.5& \text{if } 0.03 \le S \lt 0.05 \\
		1& \text{if } 0.05 \le S \lt 0.08 \\
		0& \text{if } 0.08 \le S \lt 0.10 \\
	\end{cases} \\
	D_a &= 1_{[0.00, 0.03) \cup [0.05, 0.08)}(S) ~ 0.5198 + 1_{[0.03, 0.05)}(S) ~ 0 + 1_{[0.08, 0.10)}(S) ~ 0.0002 \\
	    &= \begin{cases}
		0.5198& \text{if } 0.00 \le S \lt 0.03 \\
		0& \text{if } 0.03 \le S \lt 0.05 \\
		0.5198& \text{if } 0.05 \le S \lt 0.08 \\
		0.0002& \text{if } 0.08 \le S \lt 0.10 \\
	\end{cases} \\
	\end{align*}
	$$

	And now, we can take these piecewise variables and compute the total probability from them. $S$ is uniform, so it's as simple as multiplying each probability by the span as their weight.

	$$
	\begin{align*}
	p_b &= P \left( \begin{cases}
		1& \text{if } 0.00 \le S \lt 0.03 \\
		0.5& \text{if } 0.03 \le S \lt 0.05 \\
		1& \text{if } 0.05 \le S \lt 0.08 \\
		0& \text{if } 0.08 \le S \lt 0.10 \\
	\end{cases} \right) \\
	    &= \frac{1 (0.03-0.00) + 0.5 (0.05-0.03) + 1 (0.08-0.05) + 0 (0.10-0.08)}{0.10} \\
	    &= 0.7 \\
	p_0 &= 1 - p_b \\
	    &= 0.3 \\
	p_a &= P \left( \begin{cases}
		0.5198& \text{if } 0.00 \le S \lt 0.03 \\
		0& \text{if } 0.03 \le S \lt 0.05 \\
		0.5198& \text{if } 0.05 \le S \lt 0.08 \\
		0.0002& \text{if } 0.08 \le S \lt 0.10 \\
	\end{cases} \right) \\
	    &= \frac{0.5198 (0.03-0.00) + 0 (0.05-0.03) + 0.5198 (0.08-0.05) + 0.0002 (0.10-0.08)}{0.10} \\
	    &= 0.31192 \\
	\end{align*}
	$$

13. Compute the expected value of the probability distribution.

	The expected value of a continuous distribution is $E[X] = \int_{-\infty}^\infty x ~ \mathrm{d}F(x) = \int_{-\infty}^\infty x f(x) ~ \mathrm{d}x$, where $f(x)$ is the probability density function and $F(x)$ is the corresponding cumulative distribution function. The expected value is a generalization of the weighted average, where you're taking a mean of all the possible values, weighted by their individual probabilities.

	Remember our cumulative distribution function?

	$$
	\begin{align*}
	F(x) &= \begin{cases}
		\frac{(1+x)^2}{2}& \text{if } -1 \le x \lt 0 \\
		1 - \frac{(1-x)^2}{2}& \text{if } 0 \le x \le 1 \\
		0& \text{otherwise}
	\end{cases} \\
	     &= 1_{[-1, 1]}(x) ~ \text{sgn}(x) \left(\frac{x^2-2|x|+1}{2} \right) \\
	\end{align*}
	$$

	Well, the probability density function is the derivative of that: $f(x) = \frac{\mathrm{d}}{\mathrm{d}x} F(x)$. And it just so happens that we know that derivative already: it's $f_X(t) = (1 - |t|) ~ 1_{[-1,1]}(t)$.

	We can use this and integration by parts to sidestep a lot of work here. Here's the formula for that (remember that $f'(x)$ is shorthand for the derivative of $f(x)$):

	$$
	\begin{align*}
	\int_a^b u(x) v'(x) ~ \mathrm{d}x &= \left[ u(x) v(x) \right]_a^b &- \int_a^b u'(x) v(x) \\
	    &= u(b)v(b) - u(a)v(a) &- \int_a^b u'(x) v(x) \\
	\end{align*}
	$$

	While the interval is from $-\infty$ to $\infty$, we know the probability is only non-zero from $-1$ to $1$, so we can let $a=-1$ and $b=1$. Chopping up the intervals like this (integrals do have sum and difference rules) lets us cut out even more work.

	So, let's let $u(x) = x$ and $v(x) = F(x)$ (and thus $u'(x) = 1$ and $v'(x) = f_X(x)$), so that when we plug it in to $\int_a^b u(x) v'(x) ~ \mathrm{d}x$, it just happens to come out to $E[X] = \int_a^b x f_X(x) ~ \mathrm{d}x$. Plugging everything in gives us this:

	$$
	\begin{align*}
	\int_a^b x f_X(x) ~ \mathrm{d}x &= b F(b) - a F(a) - \int_a^b 1 F(x) ~ \mathrm{d}x \\
	    &= 1 F(1) - (-1) F(-1) - \int_{-1}^1 F(x) ~ \mathrm{d}x \\
	    &= 1 (1) - (-1) 0 - \int_{-1}^1 F(x) ~ \mathrm{d}x \\
	    &= 1 - \int_{-1}^1 F(x) ~ \mathrm{d}x \\
	\end{align*}
	$$

	And to work that integral out:

	$$
	\begin{align*}
	E[X] &= \int_a^b x f_X(x) ~ \mathrm{d}x \\
	     &= 1 - \int_{-1}^1 F(x) ~ \mathrm{d}x \\
	     &= 1 - \int_{-1}^1 \left( \begin{cases}
		\frac{(1+x)^2}{2}& \text{if } -1 \le x \lt 0 \\
		1 - \frac{(1-x)^2}{2}& \text{if } 0 \le x \le 1
	\end{cases} \right) ~ \mathrm{d}x \\
	     &= 1 - \left( \int_{-1}^0 \frac{(1+x)^2}{2} ~ \mathrm{d}x + \int_0^1 1 - \frac{(1-x)^2}{2} ~ \mathrm{d}x \right) \\
	     &= 1 - \left( \frac{1}{2} \int_{-1}^0 (1+x)^2 ~ \mathrm{d}x + 1 - \frac{1}{2} \int_{-1}^0 x^2 ~ \mathrm{d}x \right) \\
	     &= 1 - 1 + \frac{1}{2} \left( \int_0^1 x^2 ~ \mathrm{d}x - \int_{-1}^0 (1-x)^2 ~ \mathrm{d}x \right) \\
	     &= 1 - 1 - \frac{1}{2} \left( \int_{-1}^0 (1+x)^2 ~ \mathrm{d}x - \int_0^1 (1-x)^2 ~ \mathrm{d}x \right) \\
	     &= \frac{1}{2} \left( \int_0^1 (1-x)^2 ~ \mathrm{d}x - \int_{-1}^0 (1+x)^2 ~ \mathrm{d}x \right) \\
	     &= \frac{1}{2} \left( \left[ -\frac{1}{3} (1-x)^3 \right]_0^1 - \left[ \frac{1}{3} (1+x)^3 \right]_{-1}^0 \right) \\
	     &= \frac{1}{2} \left( \left( 0 - (-\frac{1}{3}) \right) - \left( \frac{1}{3} - 0 \right) \right) \\
	     &= 0 \\
	\end{align*}
	$$

	And thus, $E[X] = 0$.

	> Notes:
	> - [Cavalieri's quadrature formula](https://en.wikipedia.org/wiki/Cavalieri%27s_quadrature_formula) states that $\int x^n ~ \mathrm{d}x = x^{n+1} / (n+1) + C$ for $n \ge 0$, or $\int x^2 ~ \mathrm{d}x = x^3/3 + C$ in this case. This uses a minor variant based on that, $\int (ax+b)^n ~ \mathrm{d}x = (ax+b)^{n+1} / a(n+1) + C$.
	> - This uses the fundamental theorem of calculus, $\int_a^b f(x) ~ \mathrm{d}x = F(b) - F(a)$ where $\frac{\mathrm{d}}{\mathrm{d}x} F(x) = f(x)$ or, equivalently, $\int f(x) ~ \mathrm{d}x = F(x)$. $[F(x)]_a^b = F(b) - F(a)$ is a common shorthand.
</details>

So in other words, we can't just blindly rely on the obvious way of measuring time spans. It can give us a lot of outliers, and for sufficiently fast code segments, it just outright breaks down.
