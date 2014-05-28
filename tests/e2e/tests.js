var dummyEl = document.getElementById('dummy')

test('Mithril accessible as window.m', function() {
	expect(1);
	ok(window.m);
});


test('array item removal', function() {
	expect(2);
	var view1 = m('div', {}, [
		m('div', {}, '0'),
		m('div', {}, '1'),
		m('div', {}, '2')
	]);

	var view2= m('div', {}, [
		m('div', {}, '0'),
	]);

	m.render(dummyEl, view1);
	equal(dummyEl.innerHTML, '<div><div>0</div><div>1</div><div>2</div></div>', 'view1 rendered correctly');

	m.render(dummyEl, view2);
	equal(dummyEl.innerHTML, '<div><div>0</div></div>', 'view2 should be rendered correctly');

});

test('issue99 regression', function() {
	// see https://github.com/lhorie/mithril.js/issues/99
	expect(2);
	var view1 = m('div', {}, [
		m('div', {}, '0'),
		m('div', {}, '1'),
		m('div', {}, '2')
	]);

	var view2= m('div', {}, [
		m('span', {}, '0'),
	]);

	m.render(dummyEl, view1);
	equal(dummyEl.innerHTML, '<div><div>0</div><div>1</div><div>2</div></div>', 'view1 rendered correctly');

	m.render(dummyEl, view2);
	equal(dummyEl.innerHTML, '<div><span>0</span></div>', 'view2 should be rendered correctly');
});
