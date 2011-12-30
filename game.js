(function () {
	var generator, game, images, lastUpdate, context, width, height;

	repaint = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(function () {
				callback(Date.now());
			}, 20);
		};

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

	width = 800;
	height = 600;
	context = createCanvas(width, height, document.body);

	function update(time, force) {
		repaint(update);
		var delta = time - lastUpdate;
		if (delta >= 16 || force) { // Cap at 60 FPS
			lastUpdate = time;

			game.update(delta);
			game.render(context);
		}
	}

	function init() {
		lastUpdate = Date.now();
		update(lastUpdate);
	}

	game = (function () {
		function update(delta) {
		}

		function render(ctx) {
			ctx.fillStyle = '#b6d3f7';
			ctx.fillRect(0, 0, width, height);
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
			init: init,
			update: update,
			render: render

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
	}(init));
}());
