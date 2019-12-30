let playerName;
let playerNameInput = document.getElementById('playerNameInput');
const MAX_CONNS = 8; 

let socket;
socket = io();

let game; 

let canv = document.getElementById('cvs');
let ctx = canv.getContext('2d');
ctx.font = '28px Arial'; 

canv.width = window.innerWidth;
canv.height = window.innerHeight;

let tc = [60, 40];
let size = canv.width/(tc[0]+2)
let gameRect = [size, size, size*tc[0], size*tc[1]];


// baseline object 
let SnakeEX = {
    name: "",
    playernum: -1,
    color: (0,0,0),
    px: 0,
    py: 0,
    vx: 0, 
    vy: 0,
    tail: 0, 
    trail: []
}


// -- OBJECTS FOR THE GAME --
class Game {
    constructor(){
        this.players = Array(MAX_CONNS).fill(null) ;
        this.playernum = -1; ///next avaible space in list
        this.food = []
        this.food.push(this.createFood());
        this.food.push(this.createFood());
    }

    getMe(){
        return this.players[this.playernum]; 
    }

    handleNetwork() {
        socket.on('data', (data) => {
            let pn = 0; 
            Object.values(data).forEach(snake => {
                pn = snake.playernum;
                this.players[pn] = snake;
                //this.playernum = pn
              });
        }); 
        if(game.getMe()){
            socket.emit('datarequest', game.getMe()); //send data to server
        }
    }

    handleLogic() {
        this.players.forEach(snake => {
            if(snake){
                this.move(snake);
                this.checkFood(snake); 
                if(this.checkDeath(snake)){
                    console.log('dead', snake.px, snake.py);
                    this.respawn(snake);
                }
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
            if(snake != null){
                this.draw(snake, ctx)
            }
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
            if(snake){
                ctx.fillStyle = snake.color;
                text = snake.name + "'s Score: " + (snake.tail-5); 
                ctx.fillText(text, size*7*(snake.playernum+1) -size*5, size*2); 
            }
        })

    }

    // methods to apply on snake
    respawn(snake){
        snake.px = 5 * (snake.playernum+1); 
        snake.py = 5; 
        snake.tail = 5;
        snake.vx = snake.vy = 0;
        snake.trail = []; 
    }
    move(snake){
        snake.px+= snake.vx;
        snake.py+= snake.vy;
        for(var i=0; i<snake.trail.length; i++){
            if(snake.trail[i].x == snake.px && snake.trail[i].y == snake.py ){
                snake.tail = 5; 
                this.respawn(snake);
            }
        } 
        snake.trail.push({x: snake.px,y: snake.py}); 
        while( snake.trail.length> snake.tail){
            snake.trail.shift()
        }
    }
    draw(snake, ctx){
        //paint snake
        ctx.fillStyle= snake.color; 
        for(let i=0; i<snake.trail.length; i++){
            ctx.fillRect(snake.trail[i].x*size, snake.trail[i].y*size, size-2, size-2)
        } 
    }

};

game  = new Game();  
socket.on('pn', (pn) => {
    game.playernum = pn;
}) 


// -- menu screen and setup -- 

function startGame() {
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';
    
    game.handleNetwork()
    // add player
    socket.emit('addplayer', {playerName: playerName}); //sends json
   
    
    setInterval(gameloop,1000/5);
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
    //console.log(game, socket)
    window.addEventListener('keydown', getDirection);
    //game.handleNetwork(socket);
    game.handleLogic();
    game.handleGraphics(ctx);
    game.handleNetwork(socket);
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
    console.log('here')
    if(this.playernum != -1){
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
    }
    window.removeEventListener('keydown', getDirection); //remove so no runinto self
};




