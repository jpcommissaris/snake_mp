









class Snake {
    

    constructor(player){
        this.player = player; 
        document.addEventListener("keydown",keyPush);
    }

    spawn(){
        px = 5 * player; 
        py = 5; 
        tail = 5;
        vx = vy = 0;
    }

    
    checkDeath(){
        //snake just created
        if(px == py == -5){
            return true; 
        }

        //snake hits wall
        if(px<0 || px>size || py <0 || py>size){
            return true; 
        }
        return false; 
    }

    
    //draw the snake 
    draw(){
        //paint snake
        ctx.fillStyle= "lime"; 
        for(var i=0; i<trail.length; i++){
            ctx.fillRect(trail[i].x*size, trail[i].y*size, size-2, size-2)
            if(trail[i].x == px && trail[i].y ==py ){
                tail = 5; 
            }
        } 
    }
}; 