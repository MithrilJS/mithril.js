# Change Log for ospec


## Upcoming...
<!-- Add new lines here. Version number will be decided later -->
- ... 


## 2.0.0
_2018-05-xx_
- Allow piping a custom list of test-files to the `ospec` binary ([#2137](https://github.com/MithrilJS/mithril.js/pull/2137))
- Added support for custom reporters ([#2020](https://github.com/MithrilJS/mithril.js/pull/2020))
- Make Ospec more [Flems](https://flems.io)-friendly ([#2034](https://github.com/MithrilJS/mithril.js/pull/2034))
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



