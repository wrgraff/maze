const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 8;
const cellsVertical = 5;
const width = window.innerWidth;
const height = window.innerHeight;

const unitSizeX = width / cellsHorizontal;
const unitSizeY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
    Bodies.rectangle((width / 2), 0, width, 2, {
        isStatic: true
    }),
    Bodies.rectangle(width, (height / 2), 2, height, {
        isStatic: true
    }),
    Bodies.rectangle((width / 2), height, width, 2, {
        isStatic: true
    }),
    Bodies.rectangle(0, (height / 2), 2, height, {
        isStatic: true
    }),
];

World.add(world, walls);

// Maze generation
const shuffle = arr => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
};

const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsVertical - 1).fill(false));

const horizontals = Array(cellsHorizontal - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepToCell = (row, column) => {
    // If I have visited the cell at [row, column], then return
    if (grid[row][column]) return;

    // Mark this cell as visited
    grid[row][column] = true;

    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'top'],
        [row, column + 1, 'right'],
        [row + 1, column, 'bottom'],
        [row, column - 1, 'left']
    ]);

    // For each neighbor...
    for (let neighbor of neighbors) {        
        const [nextRow, nextColumn, direction] = neighbor;

        // See if that neighbor is out of bounds
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) continue;
        
        // If we have visited that neighbor, continue to next neighbor
        if (grid[nextRow][nextColumn]) continue;
        
        // Remove a wall from either horizontals or verticals
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        } else if (direction === 'right') {
            verticals[row][column] = true;
        } else if (direction === 'top') {
            horizontals[row - 1][column] = true;
        } else if (direction === 'bottom') {
            horizontals[row][column] = true;
        }

        // Visit that next cell
        stepToCell(nextRow, nextColumn);
    }
};

stepToCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) return;

        const wall = Bodies.rectangle(
            columnIndex * unitSizeX + unitSizeX / 2,
            rowIndex * unitSizeY + unitSizeY,
            unitSizeX + 20,
            20,
            {
                isStatic: true,
                label: 'wall',
                render: { fillStyle: 'coral' }
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) return;

        const wall = Bodies.rectangle(
            columnIndex * unitSizeX + unitSizeX,
            rowIndex * unitSizeY + unitSizeY / 2,
            20,
            unitSizeY + 20,
            {
                isStatic: true,
                label: 'wall',
                render: { fillStyle: 'coral' }
            }
        );
        World.add(world, wall);
    });
});

// Goal

const goal = Bodies.rectangle(
    width - unitSizeX / 2,
    height - unitSizeY / 2,
    unitSizeX * .6,
    unitSizeY * .6,
    {
        isStatic: true,
        label: 'goal',
        render: { fillStyle: 'lime' }
    }
);

World.add(world, goal)

// Ball

const ballRadius = Math.min(unitSizeX, unitSizeY) / 4;
const ball = Bodies.circle(
    unitSizeX / 2,
    unitSizeY / 2,
    ballRadius,
    {
        label: 'ball',
        render: { fillStyle: 'cyan' }
    }
);

World.add(world, ball)

document.addEventListener('keydown', evt => {
    const {x, y} = ball.velocity;

    if (evt.keyCode === 87 || evt.keyCode === 38) {
        Body.setVelocity(ball, { x, y: y - 5 })
    }

    if (evt.keyCode === 68 || evt.keyCode === 39) {
        Body.setVelocity(ball, { x: x + 5, y })
    }
    
    if (evt.keyCode === 83 || evt.keyCode === 40) {
        Body.setVelocity(ball, { x, y: y + 5 })
    }
    
    if (evt.keyCode === 65 || evt.keyCode === 37) {
        Body.setVelocity(ball, { x: x - 5, y })
    }
});

// Win condition

Events.on(engine, 'collisionStart', evt => {
    evt.pairs.forEach(({ bodyA, bodyB }) => {
        const labels = ['ball', 'goal'];

        if (labels.includes(bodyA.label) && labels.includes(bodyB.label)) {
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            });
        }
    })
});
