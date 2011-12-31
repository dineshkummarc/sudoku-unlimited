(function (window, document) {
	var game, images, lastUpdate, context, width, height;

	repaint = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(function () {
				callback(Date.now());
			}, 20);
		};

	function initCanvas(canvas, width, height) {
		canvas.width = width;
		canvas.height = height;

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
			}, false);
		});

		['mouseMove', 'mouseOut'].forEach(function (event) {
			canvas.addEventListener(event.toLowerCase(), function (e) {
				var x, y;
				x = e.offsetX;
				y = e.offsetY;

				if (typeof x === 'undefined' || typeof y === 'undefined') {
					x = e.pageX - canvas.offsetLeft;
					y = e.pageY - canvas.offsetTop;
				}

				game[event].apply(game, [x, y, e]);
			}, false);
		});

		return canvas.getContext('2d');
	}

	/* Set up listeners on buttons */
	function initUI() {
		var menu = document.getElementById('menu');
		menu.addEventListener('click', function (e) {
			var target = e.target;
			if (/button/i.test(target.tagName) && target.id && typeof game[target.id] === 'function') {
				game[target.id].apply(game, [e]);
				e.preventDefault();
				return false;
			}
		});
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


	initUI();
	width = 578;
	height = 578;

	context = initCanvas(document.getElementById('game'), width, height);

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
		var grid, gridSource, gridLines, showErrors, generator, mouse;

		generator = new Worker('generator.js');
		generator.overlay = document.getElementById('overlay');
		generator.progressBar = document.getElementById('progressBar');
		generator.running = false;
		generator.addEventListener('message', function (event) {
			var data = event.data;
			generator.progressBar.style.width = data.progress * 100 + '%';
			if (data.complete) {
				grid = gridSource = data.grid.map(function (cell) {
					return ({
						error: false,
						editable: false,
						value: cell
					});
				});

				generator.overlay.style.opacity = 0;
				window.setTimeout(function () {
					generator.overlay.style.display = 'none';
					generator.running = false;
				}, 250);
			}
		}, false);

		function init(ctx) {
			showErrors = false;
			gridLines = createGridLines();
			mouse = { x: -1, y : -1 };

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

		function createGridLines() {
			var ctx, result = document.createElement('canvas');
			result.width = width;
			result.height = height;
			ctx = result.getContext('2d');

			// draw grid outline
			ctx.lineWidth = 2.0;
			ctx.strokeStyle = '#aab';
			ctx.beginPath();
			for (j = 0;j < 9;j++) {
				ctx.moveTo(64 * j, 0);
				ctx.lineTo(64 * j, 64 * 9);

				ctx.moveTo(0, 64 * j);
				ctx.lineTo(64 * 9, 64 * j);
			}
			ctx.stroke();

			// draw grid thick lines
			ctx.lineWidth = 4.0;
			ctx.strokeStyle = '#000';
			ctx.beginPath();
			for (j = 0;j < 9;j++) {
				if (j > 0 && j%3 === 0) {
					ctx.moveTo(64 * j, 0);
					ctx.lineTo(64 * j, 64 * 9);

					ctx.moveTo(0, 64 * j);
					ctx.lineTo(64 * 9, 64 * j);
				}
			}
			ctx.stroke();

			// draw grid borders
			ctx.lineWidth = 2.0;
			ctx.strokeStyle = '#000';
			ctx.strokeRect(1, 1, 9 * 64, 9 * 64);

			return result;
		}

		function renderBoard(ctx) {
			var x, y;

			// draw grid squares
			for (y = 0;y < 9;y++) {
				for (x = 0;x < 9;x++) {
					if (showErrors && grid[y*9+x].error) {
						ctx.fillStyle = '#f00';
					} else if (grid[y*9+x].editable) {
						ctx.fillStyle = '#fff';
					} else {
						ctx.fillStyle = 'rgba(255, 255, 255, 0)';
					}

					ctx.fillRect(64 * x, 64 * y, 64, 64);
				}
			}

			// draw grid outline
			ctx.drawImage(gridLines, 0, 0);
		}

		function render(ctx) {
			var val;
			ctx.clearRect(0, 0, width, height);

			// draw numbers
			if (grid != null) {
				for (y = 0;y < 9;y++) {
					for (x = 0;x < 9;x++) {
						val = grid[y * 9 + x].value;
						if (val > 0) {
							ctx.drawImage(images[val], x * 64, y * 64);
						}
					}
				}
			}

			renderBoard(ctx);

			if (mouse.x >= 0 && mouse.y >= 0) {
				ctx.drawImage(images.x, mouse.x - 32, mouse.y - 32);
			}
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

			mouseMove: function (x, y) {
				mouse.x = x;
				mouse.y = y;
			},

			mouseOut: function (x, y) {
				mouse.x = -1;
				mouse.y = -1;
			},

			newPuzzle: function () {
				if (!generator.running) {
					generator.overlay.style.display = 'block';
					generator.overlay.style.opacity = 1;
					generator.running = true;
					generator.postMessage('createGrid');
				}
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
		files = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x', 'youwin'];
		
		files.forEach(function (file) {
			var image = new Image();

			image.onload = function () {
				images[file] = image;

				count += 1;
				if (count === files.length) {
					callback();
				}
			};

			image.src = 'images/' + file + '.png';
		});
	}(init));
}(this, this.document));
