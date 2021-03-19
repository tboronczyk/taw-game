class World {
    constructor(width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
    }

    bounds(sprite) {
        return {
            x1: sprite.width / 2,
            y1: sprite.height / 2,
            z1: 0,
            x2: this.width - sprite.width / 2,
            y2: this.height - sprite.height / 2,
            z2: this.depth
        }
    }
}

class Sprite extends Image {
    constructor(img) {
        super();
        this.src = img;
        this.posX = 0;
        this.posY = 0;
        this.posZ = 0;
        this.velocX = 0;
        this.velocY = 0;
        this.velocZ = 0;
        this.zScale = 1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(
            -(this.width + this.posZ * this.zScale) / 2,
            -(this.height + this.posZ * this.zScale) / 2
        );
        ctx.drawImage(
            this,
            this.posX,
            this.posY,
            this.width + this.posZ * this.zScale,
            this.height + this.posZ * this.zScale
        );
        ctx.restore();
    } 

    // would use sprite.width / 2 rather than delta, but passing delta allows
    // for negative (overlapping) to appear as if the ball is on the edge of
    // a hole before falling in
    collision(sprite, delta) {
        return this.posZ == sprite.posZ
            && Math.abs(this.posX - sprite.posX) < this.width / 2 + delta
            && Math.abs(this.posY - sprite.posY) < this.height / 2 + delta;
    }
}

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');
ctx.font = 'bold 72px sans-serif';
ctx.textAlign = 'center';
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 8;
ctx.lineJoin = 'round';
ctx.fillStyle = '#00008b';

const world = new World(canvas.width, canvas.height, 60);

const ball = new Sprite('ball.png');
ball.zScale = 0.25;

const goal = new Sprite('goal.png');

const holes = [
    new Sprite('hole.png'),
    new Sprite('hole.png'),
    new Sprite('hole.png'),
    new Sprite('hole.png')
];

let gameOver;

function init() {
    gameOver = false;

    ball.posX = world.width / 2;
    ball.posY = world.height / 2;
    ball.posZ = 0;
    ball.velocX = 0;
    ball.velocY = 0;
    ball.velocZ = 0;

    // don't place holes on the edge
    const padding = 25;

    goal.posX = padding + Math.random() * (world.width - padding * 2);
    goal.posY = padding + Math.random() * (world.height - padding * 2);

    holes.forEach((hole) => {
        hole.posX = padding + Math.random() * (world.width - padding * 2);
        hole.posY = padding + Math.random() * (world.height - padding * 2);
    });

    // ensure sprites don't overlap
    const sprites = [ball, goal, ...holes];
    for (let i = 1; i < sprites.length; i++) {
        for (let j = 0; j < i; j++) {
            if (sprites[i].collision(sprites[j], padding * 2)) {
                return init();
            }
        }
    }

    requestAnimationFrame(loop);
}

function update() {
    let bounds = world.bounds(ball);

    ball.posX += ball.velocX;
    if (ball.posX < bounds.x1) {
        ball.posX = bounds.x1; 
        ball.velocX = 0;
    }
    if (ball.posX > bounds.x2) {
        ball.posX = bounds.x2;
        ball.velocX = 0;
    }

    ball.posY += ball.velocY;
    if (ball.posY < bounds.y1) {
        ball.posY = bounds.y1;
        ball.velocY = 0;
    }
    if (ball.posY > bounds.y2) {
        ball.posY = bounds.y2;
        ball.velocY = 0;
    }

    ball.posZ += ball.velocZ;
    if (ball.posZ < bounds.z1) {
        ball.posZ = bounds.z1;
        ball.velocZ = 0;
    }
    if (ball.posZ > bounds.z2) {
        ball.posZ = bounds.z2;
        ball.velocZ = -ball.velocZ;
    }

    if (ball.collision(goal, -15)) {
        gameOver = 'YOU WIN!';
        setTimeout(init, 3000);
    }

    holes.forEach((hole) => {
        if (ball.collision(hole, -15)) {
            gameOver = 'GAME OVER';
            setTimeout(init, 3000);
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, world.width, world.height);

    holes.forEach(hole => hole.draw(ctx));
    goal.draw(ctx);

    if (gameOver === false) {
        ball.draw(ctx);
    } else {
        ctx.strokeText(gameOver, canvas.width / 2, canvas.height / 2);
        ctx.fillText(gameOver, canvas.width / 2, canvas.height / 2);
    }
}

function loop() {
    update();
    draw();
    if (gameOver === false) {
        requestAnimationFrame(loop);
    }
}

// control ball with device sensors (ie mobile)
window.addEventListener('deviceorientation', (evt) => {
    ball.velocX = evt.gamma / 2;
    ball.velocY = evt.beta / 2;
});
window.addEventListener('touchstart', (evt) => {
    if (ball.velocZ == 0) {
        ball.velocZ = 5;
    }
});

// use arrow keys for fallback controls (ie desktop)
document.addEventListener('keydown', (evt) => {
    switch (evt.code) {
        case 'ArrowUp':    ball.velocY = -5; break;
        case 'ArrowDown':  ball.velocY = +5; break;

        case 'ArrowLeft':  ball.velocX = -5; break;
        case 'ArrowRight': ball.velocX =  5; break;

        case 'Space':
            if (ball.velocZ == 0) {
                ball.velocZ = 5;
            }
            break;
    }
});
document.addEventListener('keyup', (evt) => {
    switch (evt.code) {
        case 'ArrowUp':
        case 'ArrowDown':  ball.velocY = 0; break;

        case 'ArrowLeft':
        case 'ArrowRight': ball.velocX = 0; break;
    }
});

init();
