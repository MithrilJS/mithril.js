/* global global */
import "../test-utils/injectBrowserMock.js"

import Benchmark from "benchmark"
import m from "../src/entry/mithril.esm.js"

global.m = m
global.Benchmark = Benchmark
