(function () {
	var generator, game, images, context;

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

	game = (function () {
		function init() {
		}

		return ({
			captureKey: function (code) {
				return true;
			},
			keyPressed: function (code) {},
			keyReleased: function (code) {},
			mouseWheel: function (delta) {
				console.log(delta);
			},
			init: init

		});
	}());

	/* Preload images */
	(function loadImages(callback) {
		var files, count;
		count = 0;
		images = {};
		files = [
			'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
			'about', 'button_over', 'button', 'exit', 'generating',
			'hide_errors', 'hide', 'logo', 'new_puzzle', 'restart',
			'show_errors', 'show_solution', 'x', 'youwin'
		];
		
		files.forEach(function (file) {
			var image = new Image();

			image.onload = function () {
				console.log(image.src + ' loaded');
				images[file] = image;

				count += 1;
				if (count === files.length) {
					callback();
				}
			};

			image.src = 'images/' + file + '.png';
		});
	}(game.init));
}());
