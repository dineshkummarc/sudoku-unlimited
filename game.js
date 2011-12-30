(function () {
	var generator = new Worker('generator.js');
	window.foo = generator;
	generator.addEventListener('message', function (event) {
		console.log(event.data);
	}, false);
}());
