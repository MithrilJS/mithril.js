# Change Log for ospec


## Upcoming...
<!-- Add new lines here. Version number will be decided later -->
### Features
>>>>>>> [ospec/bin] Back to ES5 (and complimentary cleanup), fix #2160
- Pinpoint the `o.only()` call site ([#2157](https://github.com/MithrilJS/mithril.js/pull/2157))
- Improved wording, spacing and color-coding of report messages and errors ([#2147](https://github.com/MithrilJS/mithril.js/pull/2147), [@maranomynet](https://github.com/maranomynet))

### Bug fixes
- Convert the exectuable back to plain ES5 [#2160](https://github.com/MithrilJS/mithril.js/issues/2160) ([#2161](https://github.com/MithrilJS/mithril.js/pull/2161))


## 2.0.0
_2018-05-09_
- Added `--require` feature to the ospec executable ([#2144](https://github.com/MithrilJS/mithril.js/pull/2144), [@gilbert](https://github.com/gilbert))
- In Node.js, ospec only uses colors when the output is sent to a terminal ([#2143](https://github.com/MithrilJS/mithril.js/pull/2143))
- the CLI runner now accepts globs as arguments ([#2141](https://github.com/MithrilJS/mithril.js/pull/2141), [@maranomynet](https://github.com/maranomynet))
- Added support for custom reporters ([#2020](https://github.com/MithrilJS/mithril.js/pull/2020), [@zyrolasting](https://github.com/zyrolasting))
- Make ospec more [Flems](https://flems.io)-friendly ([#2034](https://github.com/MithrilJS/mithril.js/pull/2034))
    - Works either as a global or in CommonJS environments
    - the o.run() report is always printed asynchronously (it could be synchronous before if none of the tests were async).
    - Properly point to the assertion location of async errors [#2036](https://github.com/MithrilJS/mithril.js/issues/2036)
    - expose the default reporter as `o.report(results)`
    - Don't try to access the stack traces in IE9



## 1.4.1
_2018-05-03_
- Identical to v1.4.0, but with UNIX-style line endings so that BASH is happy.



## 1.4.0
_2017-12-01_
- Added support for async functions and promises in tests ([#1928](https://github.com/MithrilJS/mithril.js/pull/1928), [@StephanHoyer](https://github.com/StephanHoyer))
- Error handling for async tests with `done` callbacks supports error as first argument ([#1928](https://github.com/MithrilJS/mithril.js/pull/1928))
- Error messages which include newline characters do not swallow the stack trace [#1495](https://github.com/MithrilJS/mithril.js/issues/1495) ([#1984](https://github.com/MithrilJS/mithril.js/pull/1984), [@RodericDay](https://github.com/RodericDay))



## 1.3 and earlier 
- Log using util.inspect to show object content instead of "[object Object]" ([#1661](https://github.com/MithrilJS/mithril.js/issues/1661), [@porsager](https://github.com/porsager))
- Shell command: Ignore hidden directories and files ([#1855](https://github.com/MithrilJS/mithril.js/pull/1855) [@pdfernhout)](https://github.com/pdfernhout))
- Library: Add the possibility to name new test suites ([#1529](https://github.com/MithrilJS/mithril.js/pull/1529))



