let playerName;
let playerNameInput = document.getElementById('playerNameInput');
const MAX_CONNS = 8; 

let socket;
socket = io();

let canv = document.getElementById('cvs');
let ctx = canv.getContext('2d');
ctx.font = '28px Arial'; 

canv.width = window.innerWidth;
canv.height = window.innerHeight;

let tc = [60, 40];
let size = canv.width/(tc[0]+2)
let gameRect = [size, size, size*tc[0], size*tc[1]];
let playernum = -1; 
let players = [null]; 

let food = [{x: 10, y: 20}]; 
let color = ['lightgreen', 'lightblue', 'violet', 'orange']; 

socket.on('pn', (pn) => {
    playernum = pn;
}) 

function handleGraphics(){
    // repaint white background black playing field
    ctx.fillStyle="white";
    ctx.fillRect(0,0,canv.width,canv.height); 
    ctx.fillStyle="black"; 
    ctx.fillRect(gameRect[0], gameRect[1], gameRect[2], gameRect[3]);

    //draw scroes 
    drawScores(ctx);
    // paint food
    food.forEach(f => {
        ctx.fillStyle="red"; 
        ctx.fillRect(f.x*size,f.y*size,size,size);
    }); 
    // paint snake
    let i =0; 
    players.forEach(snake => {
        ctx.fillStyle= color[i]; 
        if(snake != null){
            draw(snake, ctx)
        }
        i++; 
    });
}  


function drawScores(ctx){
    let text = ""
    let i = 0; 
    players.forEach(snake => {
        if(snake){
            ctx.fillStyle= color[i]; 
            text = snake.name + "'s Score: " + (snake.tail-5); 
            ctx.fillText(text, size*7*(i+1) -size*5, size*2); 
        }
        i++; 
    })

}
function draw(snake, ctx){
    //paint snake
    for(let i=0; i<snake.trail.length; i++){
        ctx.fillRect(snake.trail[i].x*size, snake.trail[i].y*size, size-2, size-2)
    } 
}

function gameloop() {
    socket.on('data', (data) => {
        window.addEventListener('keydown', getDirection); 
        players = data.players;
        food = data.food;
        handleGraphics(); 
    }); 
}




// -- menu screen and setup -- 

function startGame() {
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';
    // add player
    socket.emit('addplayer', {playerName: playerName}); //sends json

    gameloop();     
    
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
    let vx = players[playernum].vx
    let vy = players[playernum].vy
    if(this.playernum != -1){
        switch(evt.keyCode){
            case 37: //left
                if(vx != 1){
                    vx=-1; vy=0;
                } break;
            case 38: //up
                if(vy != 1){
                    vx=0; vy=-1;
                } break;
            case 39://right
                if(vx != -1){
                    vx=1; vy=0; 
                } break;
            case 40: //down
                if(vy != -1){
                    vx=0; vy=1;
                } break;
        }
    }
    window.removeEventListener('keydown', getDirection); //remove so no runinto self
    socket.emit('update', {vx: vx, vy: vy, pn: playernum}); 
};




