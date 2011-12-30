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

	function createArray(length, map) {
		var result = [], j;
		for (j = 0; j < length; j += 1) {
			if (typeof map === 'function') {
				result.push(map(j));
			} else {
				result.push(null);
			}
		}

		return result;
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
		game.init(context);
		lastUpdate = Date.now();
		update(lastUpdate);
	}

	game = (function () {
		var bgGradient,
			grid,
			showErrors = false,
			gridBounds = { x: 10, y: 10, width: 64 * 9, height: 64 * 9 };

		function init(ctx) {
			bgGradient = ctx.createLinearGradient(0, 0, width, height);
			bgGradient.addColorStop(0, '#fff');
			bgGradient.addColorStop(.1, '#b6d3f7');
			bgGradient.addColorStop(.7, '#b6d3f7');
			bgGradient.addColorStop(1, '#fff');

			grid = createArray(9 * 9, function () {
				return ({
					error: false,
					editable: false,
					value: 0
				});
			});
		}

		function update(delta) {
		}

		function renderBoard(ctx) {
			var x, y, val;

			// draw grid squares
			for (y = 0;y < 9;y++) {
				for (x = 0;x < 9;x++) {
					if (showErrors && grid[y*9+x].error) {
						ctx.fillStyle = '#f00';
					} else if (grid[y*9+x].editable) {
						ctx.fillStyle = '#fff';
					} else {
						ctx.fillStyle = 'rgb(255, 255, 255, 0.66';
					}

					ctx.fillRect(64 * x + gridBounds.x, 64 * y + gridBounds.y, 64, 64);
				}
			}
			
			// draw grid outline
			ctx.lineWidth = 2.0;
			ctx.strokeStyle = '#aab';
			ctx.beginPath();
			for (j = 0;j < 9;j++) {
				ctx.moveTo(64 * j + gridBounds.x, gridBounds.y);
				ctx.lineTo(64 * j + gridBounds.x, 64 * 9 + gridBounds.y);

				ctx.moveTo(gridBounds.x, 64 * j + gridBounds.y);
				ctx.lineTo(64 * 9 + gridBounds.x, 64 * j + gridBounds.y);
			}
			ctx.stroke();

			// draw grid thick lines
			ctx.lineWidth = 4.0;
			ctx.strokeStyle = '#000';
			ctx.beginPath();
			for (j = 0;j < 9;j++) {
				if (j > 0 && j%3 === 0) {
					ctx.moveTo(64 * j + gridBounds.x, gridBounds.y);
					ctx.lineTo(64 * j + gridBounds.x, 64 * 9 + gridBounds.y);

					ctx.moveTo(gridBounds.x, 64 * j + gridBounds.y);
					ctx.lineTo(64 * 9 + gridBounds.x, 64 * j + gridBounds.y);
				}
			}
			ctx.stroke();

			// draw grid borders
			ctx.lineWidth = 2.0;
			ctx.strokeStyle = '#000';
			ctx.strokeRect(gridBounds.x, gridBounds.y, 9 * 64, 9 * 64);
		}

		function render(ctx) {
			ctx.fillStyle = bgGradient;
			ctx.fillRect(0, 0, width, height);

			renderBoard(ctx);
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
