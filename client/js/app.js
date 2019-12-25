let playerName;
let playerNameInput = document.getElementById('playerNameInput');
let socket;

let canv = document.getElementById('cvs');
let ctx = canv.getContext('2d');
ctx.font = '28px Arial'; 

canv.width = window.innerWidth;
canv.height = window.innerHeight;

let tc = [60, 40];
let size = canv.width/(tc[0]+2)
let gameRect = [size, size, size*tc[0], size*tc[1]];

colors = ["lime", "lightblue", "orange", "purple"]





// -- OBJECTS FOR THE GAME --
class Game {
    constructor(){
        this.players = []; 
        this.playernum = 1; ///next avaible space in list
        this.players.push(new Snake(this.playernum, playerName));
        this.players.push(new Snake(2, "andrew")); 
        this.food = []
        this.food.push(this.createFood());
        this.food.push(this.createFood());
    }

    getMe(){
        return this.players[this.playernum-1]; 
    }

    handleNetwork(socket) {
        socket.getData(); 
        
    }

    handleLogic() {
        this.players.forEach(snake => {
            snake.move();
            this.checkFood(snake); 
            if(this.checkDeath(snake)){
                console.log('dead', snake.px, snake.py);
                snake.respawn();
            }
        });
    } 
    handleGraphics(){
        // repaint white background black playing field
        ctx.fillStyle="white";
        ctx.fillRect(0,0,canv.width,canv.height); 
        ctx.fillStyle="black"; 
        ctx.fillRect(gameRect[0], gameRect[1], gameRect[2], gameRect[3]);

        //draw scroes 
        this.drawScores(ctx);
        // paint food
        this.food.forEach(f => {
            ctx.fillStyle="red"; 
            ctx.fillRect(f.x*size,f.y*size,size,size);
        });
        // paint snake
        this.players.forEach(snake => {
            snake.draw(ctx)
        });
    }  

    // -- helper methods -- 
    createFood(){
        const x = Math.floor(Math.random()*tc[0]) + 1
        const y = Math.floor(Math.random()*tc[1]) + 1
        return {'x': x, 'y': y}; 
    }
    checkFood(snake){
        //// turn into loop
        this.food.forEach(f => {
            if(f.x ==  snake.px && f.y ==  snake.py ){
                snake.tail+=2; 
                this.food[this.food.indexOf(f)] = this.createFood();
                console.log(snake.tail)
            }
        });
        
    }
    checkDeath(snake){
        //snake just created
        if( snake.px ==  snake.py == -5){
            return true; 
        }

        //snake hits wall
        if( snake.px < 1 ||  snake.px > tc[0] 
            || snake.py < 1|| snake.py > tc[1]){
            return true; 
        }
        return false; 
    }
    drawScores(ctx){
        let text = ""
        this.players.forEach(snake => {
            ctx.fillStyle = snake.color;
            text = snake.name + "'s Score: " + (snake.tail-5); 
            ctx.fillText(text, size*7*snake.playernum -size*5, size*2); 
        })

    }
};

class Snake{ 
    constructor(player, playerName){
        this.name = playerName;
        this.playernum = player;
        this.lives = 4; //for displaying lives left
        this.respawn(); 
        this.color = colors[this.playernum-1]
        
    }
    respawn(){
        this.lives--; 
        this.alive = true;
        this.px = 5 * this.playernum; 
        this.py = 5; 
        this.tail = 5;
        this.vx = this.vy = 0;
        this.trail = []; 
    }

    move(){
        this.px+= this.vx;
        this.py+= this.vy;
        for(var i=0; i<this.trail.length; i++){
            if(this.trail[i].x == this.px && this.trail[i].y == this.py ){
                this.tail = 5; 
                this.respawn();
            }
        } 
        this.trail.push({x: this.px,y: this.py}); 
        while( this.trail.length> this.tail){
            this.trail.shift()
        }
    }

    draw(ctx){
        //paint snake
        ctx.fillStyle= this.color; 
        for(var i=0; i<this.trail.length; i++){
            ctx.fillRect(this.trail[i].x*size, this.trail[i].y*size, size-2, size-2)
        } 
    }
    //object to send to server
    getData(){
        return ({
            name: this.name, 
            playernum: this.playernum, 
            vx: this.vx, 
            vy: this.vy
        });
    }

}; 


// -- menu screen and setup -- 

function startGame() {
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';
    socket = io();
    socket.emit('newplayer', {playerName: playerName}); //sends json
    game = new Game()
    setInterval(gameloop,1000/15);
}

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    var regex = /^\w*$/;
    console.log('Regex Test', regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null;
}

window.onload = function() {
    'use strict';
    var btn = document.getElementById('startButton'),
        nickErrorText = document.querySelector('#startMenu .input-error');
    btn.onclick = function () {
        // check if the nick is valid
        if (validNick()) {
            startGame();
        } else {
            nickErrorText.style.display = 'inline';
        }
    };
    playerNameInput.addEventListener('keypress', (e) => {
        var key = e.which || e.keyCode;
        if (key === 13) {
            if (validNick()) {
                startGame();
            } else {
                nickErrorText.style.display = 'inline';
            }
        }
    });
};

// -- GAME LOOP HERE --
function gameloop(){
    window.addEventListener('keydown', getDirection);
    game.handleLogic();
    game.handleGraphics(ctx);
}


// -- event listeners --

window.addEventListener('resize', () => {
    canv.width = window.innerWidth;
    canv.height = window.innerHeight;
    size = canv.width/(tc[0]+2)
    sizeH = canv.height/(tc[1]+2)
    gameRect = [size, size, size*tc[0], size*tc[1]];
}, true);

function getDirection(evt){
    //switch direction as long as its not a 180
    switch(evt.keyCode){
        case 37: //left
            if(game.getMe().vx != 1){
                game.getMe().vx=-1; game.getMe().vy=0;
            } break;
        case 38: //up
            if(game.getMe().vy != 1){
                game.getMe().vx=0; game.getMe().vy=-1;
            } break;
        case 39://right
            if(game.getMe().vx != -1){
                game.getMe().vx=1; game.getMe().vy=0; 
            } break;
        case 40: //down
            if(game.getMe().vy != -1){
                game.getMe().vx=0; game.getMe().vy=1;
            } break;
    }
    window.removeEventListener('keydown', getDirection); //remove so no runinto self
};




