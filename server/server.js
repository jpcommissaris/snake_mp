//https://socket.io/docs/emit-cheatsheet/

const express = require('express');
const app     = express();
const http    = require('http').Server(app);
const io  = require('socket.io')(http);
const config  = require('./config.json');
const MAX_CONNS = 8; 

const players = Array(MAX_CONNS).fill(null); 
let food = []

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
      food.forEach(f => {
          if(f.x ==  snake.px && f.y ==  snake.py ){
              snake.tail+=2; 
              food[food.indexOf(f)] = this.createFood();
              console.log(snake.tail)
          }
      });
  }
  checkDeath(snake){
      //if snake hits wall
      if( snake.px < 1 ||  snake.px > this.tc[0] 
          || snake.py < 1|| snake.py > this.tc[1]){
            this.respawn(snake);
      }
      //if snake hits another snake or itself
      players.forEach((other) => {
        if(other){
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
  }
};

const game = new Game(); 

// -- GAME LOOP HERE --
setInterval(handleLogic,1000/5);

  // handle the core functins of the sankes
function handleLogic() {
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
      break;
    }
  }
  console.log(players);
  
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
        break; 
      }
    }
  } 
  //console.log(players)
}; 

function update(data){
  players[data.pn].vx = data.vx; //update players with data that socket sends
  players[data.pn].vy = data.vy;
  console.log(players); 
}

function createSnake(name, id){
  return ({
    name: name, 
    id: id, 
    px: 0,
    py: 0,
    vx: 0, 
    vy: 0,
    tail: 5, 
    trail: []
  });
}

