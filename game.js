(function () {
	var generator, game, context;

	function createCanvas(width, height, node) {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		if (node) {
			node.appendChild(canvas);
			canvas.tabIndex = 0;
			canvas.focus();
			canvas.addEventListener('keydown', function (e) {
				if (game.captureKey(e.keyCode)) {
					game.keyPressed(e.keyCode);
					e.preventDefault();
					return false;
				}
			}, false);
			canvas.addEventListener('keyup', function (e) {
				if (game.captureKey(e.keyCode)) {
					game.keyReleased(e.keyCode);
					e.preventDefault();
					return false;
				}
			}, false);

			['DOMMouseScroll', 'mousewheel'].forEach(function (event) {
				canvas.addEventListener(event, function (e) {
					game.mouseWheel(e.detail || e.wheelDelta * -1 || 0);
					e.preventDefault();
					return false;
				});
			});
		}

		return canvas.getContext('2d');
	}

	var generator = new Worker('generator.js');
	generator.addEventListener('message', function (event) {
		var data = event.data;
		console.log(data);

		if (data.complete) {
			console.log(data.grid.join('').match(/\d{9}/g).join('\n'));
		}
	}, false);

	context = createCanvas(800, 600, document.body);

	game = {
		captureKey: function (code) {
			return true;
		},
		keyPressed: function (code) {},
		keyReleased: function (code) {},
		mouseWheel: function (delta) {
			console.log(delta);
		}
	};
}());
