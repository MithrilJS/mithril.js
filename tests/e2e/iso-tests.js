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

function getEl(id) {
	return document.getElementById(id);
}

var dummyEl = getEl('dummy');
var renderEl = getEl('render');

function emptyEl(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

// fake server rendering of html by rendering in temp location and then copying
// todo: browserify isomorph and gitignore result so we can test
//  everything here in e2e
function isoRender(module) {
    emptyEl(dummyEl);
    m.render(renderEl, module.view());
    dummyEl.innerHTML = renderEl.innerHTML;
    emptyEl(renderEl);
}

function getEls(elIds) {
    var els = [];
    for (var i = 0; i < elIds.length; ++i) {
        els.push(getEl(elIds[i]));
    }
    return els;
}

function redrawExistingAndTest(module, elIds) {
    var before = getEls(elIds);
    
    m.redraw.strategy('existing');
    m.module(dummyEl, module);
    
    var after = getEls(elIds);
    // test that all our dom elements have not been re-created
    for (var i = 0; i < elIds.length; ++i) {
        ok(before[i] === after[i]);
    }
}

test('does not create new dom elements', function noNewDomElements() {
	expect(1);
    
    var mod = {
        view:function(){
            return m('b#d0', 'simple');
        }
    };
    
    isoRender(mod);
    redrawExistingAndTest(mod, ['d0']);
});

asyncTest('registers events', function registersEvents() {
	expect(3);
    
    var mod = (function(){
        var count = 0;
        return {
            view:function(){
                return m('div', [
                    m('p#p0', 'count='+count),
                    m('button#b0', {onclick:function(){
                        count++;
                    }}, 'button')
                ]);
            }
        };
    })();
    
    isoRender(mod);
    redrawExistingAndTest(mod, ['p0', 'b0']);
    
    Syn.click({}, 'b0', function(){
        equal(getEl('p0').innerHTML, 'count=1');
        start();
    });
});
