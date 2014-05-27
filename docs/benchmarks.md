## Benchmarks

These benchmarks were designed to measure Javascript running time for Mithril in comparison with other popular Javascript MVC frameworks. Javascript running time is significant because the gzipped size of a framework can be misleading in terms of how much code actually runs on page loads. In my experience, page loads happen far more commonly than one would expect in single page applications: power users open multiple tabs, and mobile users open and close the browser very frequently. And as far as templating engines go, the initial page load represents the worst case for the rendering algorithm since there is very little room for performance optimization tricks. It's arguably also [one of the most important metrics when it comes to performance](http://blog.kissmetrics.com/loading-time/).

The numbers shown here are best-run results for all frameworks, except for Mithril's case, for which I'm taking the worst-run result. The numbers aren't statistically rigorous (e.g. I didn't bother to calculate standard deviation), but they should be enough to give a rough idea of what is faster than what.

Generally speaking, these tests are making a deliberate effort to be **biased in favor of other frameworks:** for example, I don't load "optional-but-usually-used-in-real-life" things like the router module for Angular, or Marionette in Backbone's case, and I load the entirety of Mithril. In addition, this test deliberately avoids triggering `requestAnimationFrame`-based performance optimizations for Mithril, since this optimization does not exist in many frameworks and [*severely* skews numbers in Mithril's favor](http://jsperf.com/angular-vs-knockout-vs-ember/308) in CPU-intensive situations like parallax sites. I'm also NOT using the [Mithril template compiler](compiling-templates.md), which would also skew the benchmark in Mithril's favor.

To run the execution time tests below, click on their respective links, run the profiler from your desired browser's developer tools and measure the running time of a page refresh (lower is better).

<div class="performance" style="padding:0 0 0 10px;">
	<div class="row">
		<div class="col(4,4,6)">
			<h3>Loading</h3>
			<table>
				<tr><td><a href="comparisons/mithril.parsing.html">Mithril</a></td><td><span class="bar" style="background:#161;width:1%;"></span> 0.28ms</td></tr>
				<tr><td><a href="comparisons/jquery.parsing.html">jQuery</a></td><td><span class="bar" style="background:#66c;width:26%;"></span> 13.11ms</td></tr>
				<tr><td><a href="comparisons/backbone.parsing.html">Backbone</a></td><td><span class="bar" style="background:#33c;width:37%;"></span> 18.54ms</td></tr>
				<tr><td><a href="comparisons/angular.parsing.html">Angular</a></td><td><span class="bar" style="background:#c33;width:14%;"></span> 7.49ms</td></tr>
				<tr><td><a href="comparisons/react.parsing.html">React</a></td><td><span class="bar" style="background:#6af;width:50%;"></span> 24.99ms</td></tr>
			</table>
		</div>
		<div class="col(8,8,12)">
			<h3>Rendering</h3>
			<table>
				<tr><td><a href="comparisons/mithril.rendering.html">Mithril</a></td><td><span class="bar" style="background:#161;width:4%;"></span> 9.44ms (uncompiled)</td></tr>
				<tr><td><a href="comparisons/jquery.rendering.html">jQuery</a></td><td><span class="bar" style="background:#66c;width:17%;"></span> 40.27ms</td></tr>
				<tr><td><a href="comparisons/backbone.rendering.html">Backbone</a></td><td><span class="bar" style="background:#33c;width:10%;"></span> 23.05ms</td></tr>
				<tr><td><a href="comparisons/angular.rendering.html">Angular</a></td><td><span class="bar" style="background:#c33;width:50%;"></span> 118.63ms</td></tr>
				<tr><td><a href="comparisons/react.rendering.html">React</a></td><td><span class="bar" style="background:#6af;width:33%;"></span> 79.65ms</td></tr>
			</table>
		</div>
	</div>
</div>

Feel free to implement versions of the tests above in other frameworks, if you wish. The code is very simple.
