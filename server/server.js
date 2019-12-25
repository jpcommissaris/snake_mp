const express = require('express');
const app     = express();
const http    = require('http').Server(app);
const server  = require('socket.io')(http);
const config  = require('./config.json');

const MAX_CONNS = 8; 

const players = {}
let numplayers = 0; 
const spots = Array(MAX_CONNS).fill(false);

//setup server
app.use(express.static(__dirname + '/../client'));

const serverPort = process.env.PORT || config.port;
http.listen(serverPort, () => {
  console.log("Server is listening on port " + serverPort);
});


server.on('connection', (socket) => {
  numplayers++; 

  socket.on('disconnect', disconnect);
  socket.on('newplayer', addPlayer); 
    
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
  players[this.id] = formatData(data.playerName, pn, 0,0 )
  console.log(players)
  console.log(spots)
}

//disconnect a player
function disconnect(){
  numplayers--; 
  if(players[this.id]){
    spots[players[this.id].playernum] = false; //set slot to open
    delete players[this.id];
  }
  console.log('A user disconnected');
  console.log(players)
  console.log(spots)
}; 





function formatData(name, playernum, vx, vy){
  return ({
    name: name, 
    playernum: playernum, 
    vx: vx, 
    vy: vy
  });
}
