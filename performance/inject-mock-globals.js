/* global global */
import "../test-utils/injectBrowserMock.js"
import "../src/browser.js"
import Benchmark from "benchmark"

global.Benchmark = Benchmark
