//https://socket.io/docs/emit-cheatsheet/

const express = require('express');
const app     = express();
const http    = require('http').Server(app);
const io  = require('socket.io')(http);
const config  = require('./config.json');

const MAX_CONNS = 8; 

const players = {}
const spots = Array(MAX_CONNS).fill(false);

const colors = ["lime", "lightblue", "orange", "purple"]

//setup server
app.use(express.static(__dirname + '/../client'));

const serverPort = process.env.PORT || config.port;
http.listen(serverPort, () => {
  console.log("Server is listening on port " + serverPort);
});


io.on('connection', (socket) => {
  console.log('New connection with id ' +socket.id)
  socket.emit('pn', playernum())
  socket.on('disconnect', disconnect);
  socket.on('addplayer', addPlayer); 
  socket.on('datarequest', sendData);    
});

//adds info to player 
function addPlayer(data){
  let pn = MAX_CONNS;
  //add player to earliest slot
  for(let i = 0; i < MAX_CONNS; i++){
    if(!spots[i]){
      spots[i] = true;
      pn = i;
      break;
    }
  }
  players[this.id] = createSnake(data.playerName, pn);
  console.log(players);
  console.log('in add player');
  io.emit('data', players); 
}

function playernum(){
  let pn = MAX_CONNS;
  //add player to earliest slot
  for(let i = 0; i < MAX_CONNS; i++){
    if(!spots[i]){
      pn = i;
      break;
    }
  }
  console.log(pn)
  return pn; 
}

//disconnect a player
function disconnect(){
  if(players[this.id]){
    spots[players[this.id].playernum] = false; //set slot to open
    delete players[this.id];
  }
  console.log('A user disconnected');
  console.log(players)
}; 

function sendData(data){
  players[this.id] = data; //update players with data that socket sends
  io.emit('data', players); 
}





function createSnake(name, playernum){
  return ({
    name: name, 
    playernum: playernum, 
    color: colors[playernum],
    px: 0,
    py: 0,
    vx: 0, 
    vy: 0,
    tail: 1, 
    trail: []
  });
}
