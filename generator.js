(function (self) {
	var generator, postMessage = self.postMessage;

	self.onmessage = function (event) {
		if (event.data === 'createGrid') {
			generator.createGrid();
		}
	};

	function rand(min, max) {
		return min + Math.floor(Math.random() * (max - min));
	}

	function createArray(length, defaultValue) {
		var result = [], j;
		for (j = 0; j < length; j += 1) {
			result.push(defaultValue || 0);
		}

		return result;
	}

	generator = (function () {
		var grid, running, progress;
		running = false;
		progress = 0;

		function valid() {
			// vertical checking is not neccessary, since the code will only use a number once in the column
			// this validation simply checks 3x3 tiles, ensuring only 1-9 appears once per 3x3 section

			var rowSet, colSet, used, vx, vy, number;
			used = [];

			for (rowSet = 0; rowSet < 3; rowSet += 1) {
				for (colSet = 0; colSet < 3; colSet += 1) {
					used = createArray(11);
					for (vy = 0; vy < 3; vy += 1) {
						for (vx = 0; vx < 3; vx += 1) {
							number = grid[(rowSet * 3 + vy) * 9 + (colSet * 3 + vx)];
							if (number !== 0) {
								used[number] += 1;
							}
							if (used[number] > 1) {
								return false;
							}
						}
					}
				}
			}

			// it made it this far, now a hortizonal test..
			for (vy = 0; vy < 9; vy += 1) {
				used = createArray(11);
				for (vx = 0; vx < 9; vx += 1) {
					number = grid[vy * 9 + vx];
					if (number !== 0) {
						used[number] += 1;
					}
					if (used[number] > 1) {
						return false;
					}
				}
			}

			progress += 1;
			postMessage({ progress: progress / 9, complete: false });

			return true;
		}

		function createGrid() {
			if (running) {
				return;
			}

			var j, y, x, num, numUsed, tries;

			running = true;
			progress = 0;
			tries = 0;
			numUsed = [];

			grid = createArray(9 * 9);

			for (x = 0; x < 8; x += 1) {
				tries = 0;
				do {
					tries += 1;
					numUsed = createArray(11, 0);
					for (y = 0; y < 9; y += 1) {
						num = rand(1, 10);
						while (numUsed[num] !== 0) {
							num = rand(1, 10);
						}
						numUsed[num] = 1;
						grid[y * 9 + x] = num;
					}
				} while (tries < 500000 && !valid());

				if (tries >= 500000) {
					grid = createArray(9 * 9);
					x = -1;
					progress = 0;
				}
			}

			// the last column does not need to be randomly decided, there is only 1 solution
			for (y = 0; y < 9; y += 1) {
				numUsed = createArray(11);
				for (x = 0; x < 8; x += 1) {
					numUsed[grid[y * 9 + x]] += 1;
				}
				for (x = 1; x <= 9; x += 1) {
					if (numUsed[x] < 1) {
						grid[y * 9 + 8] = x;
					}
				}
			}

			running = false;
			postMessage({ progress: 1, complete: true, grid: grid });
		}

		return ({ createGrid: createGrid });
	}());
}(this));
