//https://socket.io/docs/emit-cheatsheet/

const express = require('express');
const app     = express();
const http    = require('http').Server(app);
const io  = require('socket.io')(http);
const config  = require('./config.json');
const MAX_CONNS = 8; 

const players = Array(MAX_CONNS).fill(null); 
let food = []
let clients = 0; 

// -- OBJECTS FOR THE GAME --
class Game {
  constructor(){
      this.tc = [60, 40];
      food.push(this.createFood());
  }
 // -- helper methods -- 
  createFood(){
      const x = Math.floor(Math.random()*this.tc[0]) + 1
      const y = Math.floor(Math.random()*this.tc[1]) + 1
      return {'x': x, 'y': y}; 
  }
  checkFood(snake){
      //// turn into loop
      if(clients > 1){
        food.forEach(f => {
            if(f.x ==  snake.px && f.y ==  snake.py ){
                snake.tail+=2; 
                food[food.indexOf(f)] = this.createFood();
            }
        });
      }
  }
  checkWinner(){
    let winner = -1;
    if(clients > 1){
      let alive = 0;
      for(let i = 0; i < players.length; i++){
        if(players[i]){
          if(players[i].lives > 0){
            winner = i; 
            alive++; 
          } 
          if(alive >= 2){
            return -1;
          }
        }
      }
    }
    return winner; 
  }
  checkDeath(snake){
      //if snake hits wall
      if( snake.px < 1 ||  snake.px > this.tc[0] 
          || snake.py < 1|| snake.py > this.tc[1]){
            this.respawn(snake);
      }
      //if snake hits another snake or itself
      if(snake.immune >= 15){
        players.forEach((other) => {
          if(other && other.immune >= 15){
            for(let i=0; i<other.trail.length; i++){
                if(other.trail[i].x === snake.px && other.trail[i].y === snake.py ){
                  console.log('dead', snake.px, snake.py);
                  if(other.px === snake.px && other.py === snake.py ) { //check head to head
                    this.respawn(other);
                  }
                  this.respawn(snake);
                }
            }
          }
        });
      }else{
        snake.immune++; 
      }
  }
  respawn(snake){
      const x = Math.floor(Math.random()*(this.tc[0]-10))+5
      const y = Math.floor(Math.random()*(5))+1
      snake.px = x; 
      snake.py = 5*y; 
      snake.tail = 5;
      snake.vx = 0;
      snake.vy = 1;
      snake.trail = []; 
      snake.immune = 0; 
      if(clients > 1){
        snake.lives--; 
      }else if(clients === 1){
        snake.lives = 3; 
      }
  }
};

const game = new Game(); 

// -- GAME LOOP HERE --
setInterval(handleLogic,1000/15);

  // handle the core functins of the sankes
function handleLogic() {
    if(clients > 1){
    players.forEach(snake => {
        if(snake){
          //move 
          snake.px+= snake.vx;
          snake.py+= snake.vy;
          //check collisions
          game.checkFood(snake); 
          game.checkDeath(snake); 
          //update trail
          snake.trail.push({x: snake.px,y: snake.py}); 
          while(snake.trail.length> snake.tail){
              snake.trail.shift()
          }
        }
    });
    }
    //if theres a winn restart game
    let pn = game.checkWinner()
    if( pn != -1){
      players[pn].score++; 
      console.log(players[pn], players[pn].score)
      players.forEach(snake => {
        if(snake){
          snake.lives = 4;
          game.respawn(snake); 
        }
      })
    }
    sendData(); 
} 



//setup server
app.use(express.static(__dirname + '/../client'));

const serverPort = process.env.PORT || config.port;
http.listen(serverPort, () => {
  console.log("Server is listening on port " + serverPort);
});


io.on('connection', (socket) => {
  console.log('New connection with id ' +socket.id)
  socket.on('disconnect', disconnect);
  socket.on('addplayer', addPlayer); 
  socket.on('update', update);    
});

//adds info to player 
function addPlayer(data){
  for(let i = 0; i < MAX_CONNS; i++){
    if(players[i] === null){
      players[i] = createSnake(data.playerName, this.id);
      game.respawn(players[i]);
      food.push(game.createFood());
      sendData(); 
      this.emit('pn', i)
      clients++; 
      this.emit('clients', clients)
      break;
    }
  }
  console.log('User joined game'); 
}
function sendData(){
  io.emit('data', {players: players, food: food}); 
}


//disconnect a player
function disconnect(){
  for(let i = 0; i < players.length; i++){
    if(players[i]){
      //console.log('client', client.id, this.id); 
      if(players[i].id === this.id){ 
        console.log('A user disconnected with id: ', players[i].id);
        players[i] = null;
        food.pop();
        clients--; 
        break; 
      }
    }
  } 
  //console.log(players)
}; 

function update(data){
  players[data.pn].vx = data.vx; //update players with data that socket sends
  players[data.pn].vy = data.vy;
}

function createSnake(name, id){
  return ({
    name: name,  //playername
    id: id, //socket id
    px: 0, //positions and velocity
    py: 0,
    vx: 0, 
    vy: 0,
    tail: 5, //length
    trail: [],  //previous positions
    immune: 0, //can be killed?
    lives: 4,
    score: 0 
  });
}

