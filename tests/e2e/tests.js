var dummyEl = document.getElementById('dummy')

test('Mithril accessible as window.m', function() {
	expect(1);
	ok(window.m);
});


test('issue99 regression', function() {
	// https://github.com/lhorie/mithril.js/issues/99
	expect(3);
	var view1 = m('div', {}, [
		m('a', {href: '#/product/' + 12345}, 'link1')
	]);

	var view2 = m('div', {}, [
	  m('img', {src: 'http://www.ru', align:'right', width:400}),
	  m('h1', {}, 'Product1'),
	  m('h2', {}, 'brand')
	]);

	m.render(dummyEl, view1);
	equal(dummyEl.innerHTML, '<div><a href="#/product/12345">link1</a></div>', 'view1 rendered correctly');

	m.render(dummyEl, view2);
	equal(dummyEl.innerHTML, '<div><img src="http://www.ru" align="right" width="400"><h1>Product1</h1><h2>brand</h2></div>', 'view2 rendered correctly');

	m.render(dummyEl, view1);
	equal(dummyEl.innerHTML, '<div><a href="#/product/12345">link1</a></div>', 'view1 should be restored correctly');

});
