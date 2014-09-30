//saucelabs reporting; see https://github.com/axemclion/grunt-saucelabs#test-result-details-with-qunit
var log = []
var testName

QUnit.done(function (test_results) {
	var tests = []
	for (var i = 0, len = log.length; i < len; i++) {
		var details = log[i]
		tests.push({
			name: details.name,
			result: details.result,
			expected: details.expected,
			actual: details.actual,
			source: details.source
		})
	}
	test_results.tests = tests

	window.global_test_results = test_results
})
QUnit.testStart(function (testDetails) {
	QUnit.log(function (details) {
		if (!details.result) {
			details.name = testDetails.name
			log.push(details)
		}
	})
})

//qunit doesn't support Function.prototype.bind...
if (!Function.prototype.bind) {
	Function.prototype.bind = function (oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5
			// internal IsCallable function
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable")
		}

		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(this instanceof fNOP && oThis
					? this
					: oThis,
					aArgs.concat(Array.prototype.slice.call(arguments)))
			}

		fNOP.prototype = this.prototype
		fBound.prototype = new fNOP()

		return fBound
	}
}

//tests
var dummyEl = document.getElementById('dummy')

test('Mithril accessible as window.m', function() {
	expect(1)
	ok(window.m)
})

test('array item removal', function() {
	expect(2)
	var view1 = m('div', {}, [
		m('div', {}, '0'),
		m('div', {}, '1'),
		m('div', {}, '2')
	])

	var view2= m('div', {}, [
		m('div', {}, '0')
	])

	m.render(dummyEl, view1)
	equal(dummyEl.innerHTML, '<div><div>0</div><div>1</div><div>2</div></div>', 'view1 rendered correctly')

	m.render(dummyEl, view2)
	equal(dummyEl.innerHTML, '<div><div>0</div></div>', 'view2 should be rendered correctly')
})

test('issue99 regression', function() {
	// see https://github.com/lhorie/mithril.js/issues/99
	expect(2)
	var view1 = m('div', {}, [
		m('div', {}, '0'),
		m('div', {}, '1'),
		m('div', {}, '2')
	])

	var view2= m('div', {}, [
		m('span', {}, '0')
	])

	m.render(dummyEl, view1)
	equal(dummyEl.innerHTML, '<div><div>0</div><div>1</div><div>2</div></div>', 'view1 rendered correctly')

	m.render(dummyEl, view2)
	equal(dummyEl.innerHTML, '<div><span>0</span></div>', 'view2 should be rendered correctly')
})

test('config handler context', function() {
	expect(3)
	var view = m('div', {config: function(evt, isInitialized, context) {
		equal(context instanceof Object, true)
		context.data = 1
	}})
	m.render(dummyEl, view)

	var view = m('div', {config: function(evt, isInitialized, context) {
		equal(context instanceof Object, true)
		equal(context.data, 1)
	}})
	m.render(dummyEl, view)
})

test('node identity remove firstChild', function() {
	expect(2)
	var view1 = m('div', {}, [
		m('div', {key:1}, 'E1'),
		m('div', {key:2}, 'E2')
	])
	m.render(dummyEl, view1)

	var node2 = dummyEl.firstChild.lastChild
	equal(node2.innerHTML, 'E2')

	var view2 = m('div', {}, [
		m('div', {key:2}, 'E2')
	])
	m.render(dummyEl, view2)

	equal(dummyEl.firstChild.firstChild, node2)
})

test('node identity change order', function() {
	expect(2)
	var view1 = m('div', {}, [
		m('div', {key:1}, 'E1'),
		m('div', {key:2}, 'E2'),
		m('div', {key:3}, 'E3')
	])
	m.render(dummyEl, view1)

	var e2 = dummyEl.firstChild.firstChild.nextSibling
	equal(e2.innerHTML, 'E2')

	var view2 = m('div', {}, [
		m('div', {key:2}, 'E2'),
		m('div', {key:1}, 'E1'),
		m('div', {key:3}, 'E3')
	])
	m.render(dummyEl, view2)

	equal(dummyEl.firstChild.firstChild, e2)
})

test('node identity remove in the middle', function() {
	expect(2)
	var view1 = m('div', {}, [
		m('div', {key:1}, 'E1'),
		m('div', {key:2}, 'E2'),
		m('div', {key:3}, 'E3')
	])
	m.render(dummyEl, view1)

	var e3 = dummyEl.firstChild.lastChild
	equal(e3.innerHTML, 'E3')

	var view2 = m('div', {}, [
		m('div', {key:1}, 'E1'),
		m('div', {key:3}, 'E3')
	])
	m.render(dummyEl, view2)

	equal(dummyEl.firstChild.firstChild.nextSibling, e3)
})

test('node identity remove last', function() {
	expect(4)
	var view1 = m('div', {}, [
		m('div', {key:1}, 'E1'),
		m('div', {key:2}, 'E2'),
		m('div', {key:3}, 'E3')
	])
	m.render(dummyEl, view1)

	var e1 = dummyEl.firstChild.firstChild
	equal(e1.innerHTML, 'E1')
	var e2 = dummyEl.firstChild.firstChild.nextSibling
	equal(e2.innerHTML, 'E2')

	var view2 = m('div', {}, [
		m('div', {key:1}, 'E1'),
		m('div', {key:2}, 'E2')
	])
	m.render(dummyEl, view2)

	equal(dummyEl.firstChild.firstChild, e1)
	equal(dummyEl.firstChild.firstChild.nextSibling, e2)
})

test('node identity shuffle and remove', function() {
	expect(8)
	var view1 = m('div', {}, [
		m('div', {key:1}, 'E1'),
		m('div', {key:2}, 'E2'),
		m('div', {key:3}, 'E3'),
		m('div', {key:4}, 'E4'),
		m('div', {key:5}, 'E5')
	])
	m.render(dummyEl, view1)

	var e1 = dummyEl.firstChild.firstChild
	equal(e1.innerHTML, 'E1')
	var e2 = e1.nextSibling
	equal(e2.innerHTML, 'E2')
	var e3 = e2.nextSibling
	equal(e3.innerHTML, 'E3')
	var e4 = e3.nextSibling
	equal(e4.innerHTML, 'E4')
	var e5 = e4.nextSibling
	equal(e5.innerHTML, 'E5')

	var view2 = m('div', {}, [
		m('div', {key:4}, 'E4'),
		m('div', {key:10}, 'E10'),
		m('div', {key:1}, 'E1'),
		m('div', {key:2}, 'E2')
	])
	m.render(dummyEl, view2)

	equal(dummyEl.firstChild.firstChild, e4, 'e4 is first element')
	equal(dummyEl.firstChild.firstChild.nextSibling.nextSibling, e1, 'e1 is third element')
	equal(dummyEl.firstChild.firstChild.nextSibling.nextSibling.nextSibling, e2, 'e2 is fourth element')
})

asyncTest('issue214 regression', function() {
	// see https://github.com/lhorie/mithril.js/issues/214
	// this test will pass using phantomjs, because phantomjs
	// doesn't provide window.requestAnimationFrame
	expect(2)

	function controller() {
		this.inputValue = m.prop('')
	}

	function view(ctrl) {
		return m('input#testinput', {
			value: ctrl.inputValue(),
			onkeyup: m.withAttr('value', ctrl.inputValue)
		})
	}

	var ctrl = m.module(dummyEl, { controller: controller, view: view })

	Syn.click({}, 'testinput')
		.type('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', function() {
			equal(ctrl.inputValue(), 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
			equal(document.getElementById('testinput').value, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
			start()
		})
})

asyncTest('issue288 regression', function() {
	// see https://github.com/lhorie/mithril.js/issues/288
	// this test will pass using phantomjs, because phantomjs
	// doesn't provide window.requestAnimationFrame
	expect(2)

	function controller() {
		this.inputValue = m.prop('')

		this.submit = function() {
			if (this.inputValue()) {
				this.inputValue('')
			}
		}.bind(this);
	}

	function view(ctrl) {
		return m('form', { onsubmit: ctrl.submit }, [
			m('input#testinput', {
				onkeyup: m.withAttr('value', ctrl.inputValue),
				value: ctrl.inputValue()
			}),
      m('button[type=submit]')
    ])
	}

	var ctrl = m.module(dummyEl, { controller: controller, view: view })

	Syn.click({}, 'testinput')
	  .type('abcd[enter]', function() {
			equal(ctrl.inputValue(), '')
			equal(document.getElementById('testinput').value, '')
			start()
		})
})
