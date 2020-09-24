// Team: Battleship
// Team Members:
//  - Phillip Presuel: phillipp@csu.fullerton.edu
//  - RJ Andaya: rjandaya98@csu.fullerton.edu
//  - Madonna Lewis: madonnalewis@csu.fullerton.edu
//  - Jose Alvarado: xxjose0xx@csu.fullerton.edu
//  - Fernando Andrade: f.andrade8@csu.fullerton.edu

let settings = {
	xSize: 40,
	ySize: 40,
	seed: 0,
	iterationsPerFrame: 10,
	newSeed: startNewRandomMaze,
	cellSize: 21,
	displayMode: 1,
	wallColor: [255, 255, 255],
	backgroundColor: [000, 000, 000],
	solutionColor: [255, 0, 0],
	showSolution: true,
	save: saveMaze,
	colorBySet: false
}

let grid = [];
let edges = [];
let solution;
let uSet;

const dx = {
	E: 1,
	W: -1,
	N: 0,
	S: 0
}
const dy = {
	E: 0,
	W: 0,
	N: -1,
	S: 1
}
const opposite = {
	E: "W",
	W: "E",
	N: "S",
	S: "N"
}

function getPosition(p) {
	p = p.toLowerCase();
	switch (p) {
		case "top left":
			return {
				x: 0,
				y: 0
			};
		case "bottom right":
			return {
				x: settings.xSize - 1,
				y: settings.ySize - 1
			};
	}
}

function setup() {
	createCanvas(windowWidth-20, windowHeight-20);
	createGUI();
	startNewRandomMaze();
}

function draw() {
	for (let i = 0; i < settings.iterationsPerFrame; i++) {
		if (edges.length > 0) {
			let edge = edges.pop();
			let x = edge.x;
			let y = edge.y;
			let direction = edge.dir;
			let nx = x + dx[direction];
			let ny = y + dy[direction];

			let cell1Index = getCellIndex(nx, ny);
			let cell2Index = getCellIndex(x, y);

			let parentCell1 = uSet.findParent(cell1Index);

			let parentCell2 = uSet.findParent(cell2Index);

			if (parentCell1 !== parentCell2) {
				grid[y][x][direction] = false;
				grid[ny][nx][opposite[direction]] = false;
				uSet.unionTwo(cell1Index, cell2Index);
			}
		}
	}
	solveAndDisplay();
}

function startMaze() {
	randomSeed(settings.seed);
	uSet = new unionSet();
	grid = [];
	edges = [];

	for (let y = 0; y < settings.ySize; y++) {
		grid[y] = [];
		for (let x = 0; x < settings.xSize; x++) {
			grid[y][x] = {
				N: true,
				S: true,
				E: true,
				W: true
			};

			if (y > 0) edges.push({
				x: x,
				y: y,
				dir: "N"
			});
			if (x > 0) edges.push({
				x: x,
				y: y,
				dir: "W"
			});

			uSet.uset.push(getCellIndex(x, y));
		}
	}
	edges = shuffle(edges);
}

function startNewRandomMaze(){
	settings.seed = floor(random(10e6));
	startMaze();
}

function solveAndDisplay() {
	solution = solve(grid, getPosition("top left"), getPosition("bottom right"));
	displayMaze();
}

function getCellIndex(x, y) {
	return y * settings.xSize + x;
}

function keyPressed() {
	if (key.toLowerCase() === "s") save();
}

function saveMaze() {
	save();
}

function displayMaze() {
	display(grid, settings.cellSize, settings.displayMode, solution);
}


// SOLVER //

function solve(mazeToSolve, startPoint, endPoint){//={x:0, y:0}, endPoint={x:mazeToSolve[0].length-1, y: mazeToSolve.length-1}, storedAsWalls = true) {
	let maze = deepCopy(mazeToSolve);
	let Q = []; //queue

	let discovered = []; //keeps track of which points have been discovered so far so it doesn't loop back on itself
	for (let y = 0; y < maze.length; y++) {
		discovered[y] = [];
		for (let x = 0; x < maze[0].length; x++) {
			discovered[y][x] = false;
		}
	}
	discovered[startPoint.y][startPoint.x] = true;

	//enqueue
	Q.unshift(startPoint);

	while (Q.length > 0) {

		//dequeue
		let v = Q.pop();

		if (v.x === endPoint.x && v.y == endPoint.y) {

			// endpoint reached. convert the route into an array of points that we can use to draw the line

			let solutionPath = [];
			let cell = v;
			solutionPath.unshift({x: cell.x, y: cell.y});
			while (!(cell.parent === undefined || (cell.parent.x === cell.x && cell.parent.y === cell.y))) {
				cell = cell.parent;
				solutionPath.unshift({x: cell.x, y: cell.y});
			}

			return solutionPath;
		}

		for (let direction in maze[v.y][v.x]) {

			//there's not a wall here so we can go this way
			if (!maze[v.y][v.x][direction]) {

				let x = v.x + dx[direction];
				let y = v.y + dy[direction];

				//valid cell to move to
				if (discovered[y] !== undefined && discovered[y][x] !== undefined) {

					//hasn't already been visited (discovered)
					if (!discovered[y][x]) {

						discovered[y][x] = true;

						//enqueue
						Q.unshift({
							x: x,
							y: y,
							parent: v
						});
					}
				}
			}
		}
	}

	//console.log("failed to find a solution");
	return [];
}


// ARRAY COPY //
//https://stackoverflow.com/questions/13756482/create-copy-of-multi-dimensional-array-not-reference-javascript

function deepCopy(obj) {
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      let l = obj.length;
      let r = new Array(l);
      for (let i = 0; i < l; i++) {
        r[i] = deepCopy(obj[i]);
      }
      return r;
    } else {
      let r = {};
      r.prototype = Object.create(Object.getPrototypeOf(obj));
      for (let k in obj) {
        r[k] = deepCopy(obj[k]);
      }
      return r;
    }
  }
  return obj;
}


// UNION SET //
class unionSet {

	constructor() {
		this.uset = [];
	}

	findParent(index) {
		let parentIndex = this.uset[index];

		//if the parent is itself, then it has no parent so it must be the parent of the set
		if (parentIndex === index) {
			return index;
		}

		//recusively find parent until it has no parent (parent is self)
		let rootParentIndex = this.findParent(parentIndex);

		//save it for later so we don't have to go searching that far up the tree again
		this.uset[index] = rootParentIndex;
		return rootParentIndex;
	}

	unionTwo(index1, index2) { //join 2 sets together
		let parent1 = this.findParent(index1);
		let parent2 = this.findParent(index2);

		if (parent1 > parent2) { //proritise cells at the top so we don't get flickering when coloring by set
			this.uset[parent1] = parent2;
		} else {
			this.uset[parent2] = parent1;

		}

	}
}

// DISPLAY MAZE //
function display(maze, cellSize, displayMode = 1, solution = [], storedAsWalls = true) {

	displayMode = Number(0); //dat.gui stores 0 as a string so I need to convert it back to a number

	if (!storedAsWalls) { //stored as passages rather than walls
		maze = invertWallsAndPassages(deepCopy(maze));
	}

	const mazeHeight = maze.length;
	const mazeWidth = maze[0].length;

	push();

	//center the screen
	translate(width / 2 - mazeWidth / 2 * cellSize, height / 2 - mazeHeight / 2 * cellSize);
	//clear the background
	background(settings.backgroundColor);

	//highlight cells that haven't finished generating differently, depending on the display mode
	//an unfinished cell is one that has all it's walls around it
	//not used for display mode 2 (line) because it looks weird
	// noStroke();

	if (displayMode === 0 || (displayMode === 1 && cellSize <= 3)) { //thin walls

		stroke(settings.wallColor);
		strokeWeight(cellSize > 3 ? 2 : cellSize > 2 ? 1 : 0.5);

		for (let y = 0; y < mazeHeight; y++) {
			for (let x = 0; x < mazeWidth; x++) {
				if (settings.colorBySet) {
					// fill(getSetColor(uSet.findParent(getCellIndex(x, y))));
				} else {
					if (maze[y][x].N && maze[y][x].S && maze[y][x].E && maze[y][x].W) {
						// fill(unifinshedCellColor);
					} else {
						fill(settings.backgroundColor);
					}
				}
				noStroke();
				rect(x * cellSize, y * cellSize, cellSize + 0.1, cellSize + 0.1);
				stroke(settings.wallColor);


				if (maze[y][x].W) {
					line(x * cellSize, y * cellSize, x * cellSize, (y + 1) * cellSize);
				}
				if (maze[y][x].N) {
					line(x * cellSize, y * cellSize, (x + 1) * cellSize, y * cellSize);
				}
				if (maze[y][x].E && x == maze.length - 1) {
					line((x + 1) * cellSize, y * cellSize, (x + 1) * cellSize, (y + 1) * cellSize);
				}
				if (maze[y][x].S && y == maze[0].length - 1) {
					line(x * cellSize, (y + 1) * cellSize, (x + 1) * cellSize, (y + 1) * cellSize);
				}
			}
		}

	} else if (displayMode === 1) { //thick walls

		noStroke();
		cellSize /= 2;
		fill(settings.wallColor);

		push();
		translate(cellSize / 2, cellSize / 2);

		rect(-cellSize, -cellSize, cellSize * 2 * mazeWidth + cellSize, cellSize * 2 * mazeHeight + cellSize);
		fill(settings.backgroundColor);

		for (let y = 0; y < mazeHeight; y++) {
			for (let x = 0; x < mazeWidth; x++) {
				if (settings.colorBySet) {
					fill(getSetColor(uSet.findParent(getCellIndex(x, y))));
				} else {
					if (maze[y][x].N && maze[y][x].S && maze[y][x].E && maze[y][x].W) {
						fill(unifinshedCellColor);
					} else {
						fill(settings.backgroundColor);
					}
				}

				rect(x * cellSize * 2, y * cellSize * 2, cellSize, cellSize);

				if (!maze[y][x].W) {
					rect(x * cellSize * 2 - cellSize, y * cellSize * 2, cellSize, cellSize);
				}
				if (!maze[y][x].N) {
					rect(x * cellSize * 2, y * cellSize * 2 - cellSize, cellSize, cellSize);
				}
				if (!maze[y][x].E && x == maze.length - 1) {
					rect(x * cellSize * 2 + cellSize, y * cellSize * 2, cellSize, cellSize);
				}
				if (!maze[y][x].S && y == maze[0].length - 1) {
					rect(x * cellSize * 2, y * cellSize * 2 + cellSize, cellSize, cellSize);
				}
			}
		}

		pop();
		cellSize *= 2;
	} else { //display mode 2: line
		stroke(settings.wallColor);
		strokeWeight(cellSize > 5 ? 2 : cellSize > 2 ? 1 : 0.5);

		push();
		translate(cellSize / 2, cellSize / 2);

		for (let y = 0; y < mazeHeight; y++) {
			for (let x = 0; x < mazeWidth; x++) {
				if (settings.colorBySet) {
					noStroke();
					fill(getSetColor(uSet.findParent(getCellIndex(x, y))));
					rect((x - 0.5) * cellSize, (y - 0.5) * cellSize, cellSize, cellSize);
					stroke(settings.wallColor);
				}

				if (!maze[y][x].W) {
					line(x * cellSize, y * cellSize, (x - 0.5) * cellSize, y * cellSize);
				}
				if (!maze[y][x].N) {
					line(x * cellSize, y * cellSize, x * cellSize, (y - 0.5) * cellSize);
				}
				if (!maze[y][x].E) {
					line(x * cellSize, y * cellSize, (x + 0.5) * cellSize, y * cellSize);
				}
				if (!maze[y][x].S) {
					line(x * cellSize, y * cellSize, x * cellSize, (y + 0.5) * cellSize);
				}
			}
		}

		pop();
	}

	if (settings.showSolution) {
		stroke(settings.solutionColor);
		// strokeWeight(constrain(cellSize * 0.27, 1, 8));
		push();
		translate(cellSize / 2, cellSize / 2);
		for (let i = 0; i < solution.length - 1; i++) {
			line(solution[i].x * cellSize, solution[i].y * cellSize, solution[i + 1].x * cellSize, solution[i + 1].y * cellSize);
		}
		pop();
	}
	pop();

}

// CREATE IT ALL
const createGUI = function() {}
