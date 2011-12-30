(function () {
	var generator = new Worker('generator.js');
	window.foo = generator;
	generator.addEventListener('message', function (event) {
		var data = event.data;
		console.log(data);

		if (data.complete) {
			console.log(data.grid.join('').match(/\d{9}/g).join('\n'));
		}
	}, false);
}());
