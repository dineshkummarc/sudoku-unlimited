(function (window, document) {
	var game, images, lastUpdate, overlay, progressBar, context, width, height;

	function initCanvas(canvas, width, height) {
		canvas.width = width;
		canvas.height = height;

		canvas.tabIndex = 0;
		canvas.focus();
		canvas.addEventListener('keydown', function (e) {
			if (game.captureKey(e.keyCode)) {
				game.keyPressed(e.keyCode);
				update();

				e.preventDefault();
				return false;
			}
		}, false);

		['DOMMouseScroll', 'mousewheel'].forEach(function (event) {
			canvas.addEventListener(event, function (e) {
				game.mouseWheel(e.detail || e.wheelDelta * -1 || 0);
				update();

				e.preventDefault();
				return false;
			}, false);
		});

		['mouseMove', 'mouseOut', 'mouseDown'].forEach(function (event) {
			canvas.addEventListener(event.toLowerCase(), function (e) {
				var x, y;
				x = e.offsetX;
				y = e.offsetY;

				if (typeof x === 'undefined' || typeof y === 'undefined') {
					x = e.pageX - canvas.offsetLeft;
					y = e.pageY - canvas.offsetTop;
				}

				game[event].apply(game, [x, y, e]);
				update();
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
				game[target.id].apply(target, [e]);
				update();

				context.canvas.focus();
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

	function rand(min, max) {
		return min + Math.floor(Math.random() * (max - min));
	}

	overlay = document.getElementById('overlay');
	progressBar = document.getElementById('progressBar');
	initUI();
	width = 578;
	height = 578;

	context = initCanvas(document.getElementById('game'), width, height);

	function update() {
		var delta, time = Date.now();
		delta = time - lastUpdate;
		if (delta >= 16) { // Cap at 60 FPS
			lastUpdate = time;

			game.render(context);
		}
	}

	function init() {
		game.init(context);
		lastUpdate = Date.now();
		update(lastUpdate);
	}

	game = (function () {
		var grid, gridSource, gridLines, showErrors, generator, mouse, keyMap;

		keyMap = {
			46: 0, 48: 0, 96: 0,
			49: 1, 97: 1,
			50: 2, 98: 2,
			51: 3, 99: 3,
			52: 4, 100: 4,
			53: 5, 101: 5,
			54: 6, 102: 6,
			55: 7, 103: 7,
			56: 8, 104: 8,
			57: 9, 105: 9,
			38: 'up',
			40: 'down'
		};

		generator = new Worker('generator.js');
		generator.running = false;
		generator.addEventListener('message', function (event) {
			var data = event.data;
			progressBar.style.width = data.progress * 100 + '%';
			if (data.complete) {
				gridSource = data.grid.map(function (cell) {
					return ({
						error: false,
						editable: false,
						value: cell
					});
				});
				grid = randomizeGrid(gridSource);

				update();

				overlay.style.opacity = 0;
				window.setTimeout(function () {
					overlay.style.display = 'none';
					generator.running = false;
					context.canvas.focus();
				}, 250);
			}
		}, false);

		function init(ctx) {
			showErrors = false;
			gridLines = createGridLines();

			mouse = { x: -1, y : -1, state: 0 };
			mouse.changeState = function (delta) {
				mouse.state = delta % 10;
				if (mouse.state < 0) {
					mouse.state += 10;
				}
			};

			grid = createArray(9 * 9, function () {
				return ({
					error: false,
					editable: false,
					value: 0
				});
			});

			render(ctx);
		}

		function copyGrid(grid) {
			return grid.map(function (cell) {
				return ({
					error: cell.error,
					editable: cell.editable,
					value: cell.value
				});
			});
		}

		function randomizeGrid(grid) {
			var result = copyGrid(grid);
			var j,n,r = rand(30,50);
			for (j = 0;j < r;j++) {
				do {
					n = rand(0,result.length-1);
				}
				while (result[n].editable);
				result[n].value = 0;
				result[n].editable = true;
			}

			return result;
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

			renderBoard(ctx);

			// draw numbers
			for (y = 0;y < 9;y++) {
				for (x = 0;x < 9;x++) {
					val = grid[y * 9 + x].value;
					if (val > 0) {
						ctx.drawImage(images[val], x * 64, y * 64);
					}
				}
			}

			if (mouse.x >= 0 && mouse.y >= 0) {
				ctx.drawImage(images[mouse.state], mouse.x - 32, mouse.y - 32);
			}
		}

		return ({
			captureKey: function (code) {
				return typeof keyMap[code] !== 'undefined';
			},

			keyPressed: function (code) {
				if (typeof keyMap[code] === 'number') {
					mouse.changeState(keyMap[code]);
				} else if (keyMap[code] === 'up') {
					mouse.changeState(mouse.state + 1);
				} else if (keyMap[code] === 'down') {
					mouse.changeState(mouse.state - 1);
				}
			},

			mouseWheel: function (delta) {
				mouse.changeState(mouse.state + (delta < 0 && 1 || delta > 0 && -1 || 0));
			},

			mouseMove: function (x, y) {
				mouse.x = x;
				mouse.y = y;
			},

			mouseOut: function (x, y) {
				mouse.x = -1;
				mouse.y = -1;
			},

			mouseDown: function (x, y) {
				var cell = Math.floor(y / 64) * 9 + Math.floor(x / 64);
				if (grid[cell] && grid[cell].editable) {
					grid[cell].value = mouse.state;
					grid[cell].error = grid[cell].value !== gridSource[cell].value && !!grid[cell].value;
				}
			},

			newPuzzle: function () {
				if (!generator.running) {
					overlay.style.display = 'block';
					overlay.style.opacity = 1;
					generator.running = true;
					generator.postMessage('createGrid');
				}
			},

			restartPuzzle: function () {
				grid = grid.map(function (cell) {
					return ({
						error: false,
						editable: cell.editable,
						value: !cell.editable && cell.value || 0
					});
				});
			},

			toggleErrors: function () {
				showErrors = !showErrors;
				this.innerHTML = (showErrors && 'Hide' || 'Show') + ' Errors';
			},

			showSolution: function () {
				if (gridSource && gridSource.length) {
					grid = gridSource;
				}
			},
			init: init,
			render: render

		});
	}());

	/* Preload images */
	(function loadImages(callback) {
		var files, count;
		count = 0;
		images = {};
		files = createArray(10, function (x) { return x; });
		
		files.forEach(function (file) {
			var image = new Image();

			image.onload = function () {
				images[file] = image;

				count += 1;
				progressBar.style.width = (count / files.length) * 100 + '%';

				if (count === files.length) {
					overlay.style.opacity = 0;
					callback();
					window.setTimeout(function () {
						overlay.style.display = 'none';
						document.getElementById('generating').style.display = 'block';
						context.canvas.focus();
					}, 250);
				}
			};

			image.src = 'images/' + file + '.png';
		});
	}(init));
}(this, this.document));
