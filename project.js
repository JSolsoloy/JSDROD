/*global
    prompt, alert
*/

/*jslint white: true,
		 vars:	true
*/

//*** Variable Initializtion ***\\

var fc = document.getElementById("field");	//Room canvas
var c  = document.getElementById("draw");	//player and roach canvas
var e  = document.getElementById("effect"); //effects canvas

var fieldCtx = fc.getContext("2d");
var ctx = c.getContext("2d");
var eff = e.getContext("2d");

var statMove = document.getElementById("moves");
var statDead = document.getElementById("deaths");
var statKill = document.getElementById("kills");

var rows     = 25;         //for use in drawing map
var cols     = 27;         //for use in drawing map
var tile     = 23;         //tile size
var timer    = 30;
var queen    = false;
var gate     = [];         //stores gates
var roach    = [];         //stores roaches
var field    = [];         //the map

var moves    =  0;		   //moves made
var deaths   =  0;		   //times restarted
var kills    =  0;		   //roaches killed

//*** Input Handler ***\\

document.addEventListener('keydown', function(e){	//Listens for keyboard input
	'use strict';
    e = e.keyCode;
	
	//order 789456123
    if(e == 81){
        player.rotate(-1);
    }
    else if(e == 87){
        player.rotate(1);
    }
    else if(e == 103 || e == 89){
        player.move(-1,-1);
    }
    else if(e == 104 || e == 85){
        player.move(-1,0)
    }
    else if(e == 105 || e == 73){
        player.move(-1,1)
    }
    else if(e == 100 || e == 72){
        player.move(0,-1)
    }
    else if(e == 101 || e == 74){
        player.move(0,0)
    }
    else if(e == 102 || e == 75){
        player.move(0,1)
    }
    else if(e == 97 || e == 78){
        player.move(1,-1)
    }
    else if(e == 98 || e == 77){
        player.move(1,0)
    }
    else if(e == 99 || e == 188){
        player.move(1,1)
    }
    else if(e == 82){
        statDead.innerHTML = ++deaths;      //adds to restart stat
        if(player.win){
            clearInterval(winning);
            map = 0;
            moves    =  0;		   //moves made
            deaths   =  0;		   //times restarted
            kills    =  0;		   //roaches killed
            statMove.innerHTML = moves;
            statDead.innerHTML = deaths;
            statKill.innerHTML = kills;
        }
        initialize();
    }
})

//*** Room Initialization ***\\

function initialize(){
    'use strict';
    timer = 30;
    gate  = [];                                       //clears gate array
    roach = [];                                       //clears roach array
    eff.fillStyle = "#808080";
    eff.fillRect(0,0,e.width,e.height);               //grey
    fieldCtx.clearRect(0,0,e.width,e.height);         //clears game canvas
    ctx.clearRect(0,0,c.width,c.height);              //clears player canvas
    for(var i = 0; i < MAPS[map].length; i++){        //copying 2D arrays is
        field[i] = MAPS[map][i].slice();              //hard
    }
    clearInterval(wipe);                              //clears animations
    clearInterval(death);
    anim = 0;                                         //reset animation index
    anim2= -15;                                       //reset animation index
    wipe = setInterval(restart,10)                    //wipe animation
    drawField();                                      //draws the field
    
}

//*** Object Constructors ***\\

var player = {
    init: function(x,y,s){
        'use strict';
        this.s = s;                         //sword direction
        this.x = x;                         //player x
        this.y = y;                         //player y
        this.X = this.x;                    //sword x
        this.Y = this.y-1;                  //sword y
        this.alive = true;                  //alive?
        this.rotate(s,true);                //sets initial dir
        this.win = false;                   //win?
        this.draw();
    },
    draw: function(){                       //player drawing function
        'use strict';
        ctx.fillStyle = "#EA4040";
        ctx.fillRect(this.x*tile,this.y*tile,tile,tile);
        ctx.fillStyle = "#808080";
        ctx.fillRect(this.X*tile,this.Y*tile,tile,tile);
    },
    move: function(y,x){                    //player movement
        'use strict';
        if(this.alive){                     //checks if the player is alive
        ctx.clearRect(this.x*tile,this.y*tile,tile,tile);
        ctx.clearRect(this.X*tile,this.Y*tile,tile,tile);
        if(!this.checkCol(y,x)){
            this.y += y;
            this.Y += y;
            this.x += x;
            this.X += x;
        } 
		
        if(field[this.y][this.x] == 9){		//you win
            this.alive = false;
            this.win   = true;
            this.draw();
            winning    = setInterval(win,320);
            return;
        }
        if(this.swordCol()){				//If a collision with the orb is
            var orb = field[this.Y][this.X];//made, the orb will activate
            orb.strike();
        }
        var clear = field[this.y][this.x];	//checks if player is on clear
        if(typeof clear == 'object'){		//gate and changes level
            if(clear.name == 'gate'){
                if(clear.state == 'x'){
                    map += 1;
                    if(map == MAPS.length){
                        return;
                    }
                    initialize();
                    return;
                }
            }
        }
        statMove.innerHTML = ++moves;          //adds to moves stat
        updateGame();
        }
    },
    rotate: function(dir,op){                  //player rotation
        'use strict';
        if(this.alive){                        //checks if player is alive
        ctx.clearRect(this.X*tile,this.Y*tile,tile,tile);
        if(!op){
			if(this.s + dir == 8){
				this.s = 0;
			} 
			else if(this.s + dir == -1){
				this.s = 7;
			} else {
				this.s += dir;
			}
		}
        switch(this.s){						  //I'm too stupid to find 
            case 0:							  //a better way to do this
                this.X = this.x;
                this.Y = this.y-1;
                break;
            case 1:
                this.X = this.x+1;
                this.Y = this.y-1;
                break;
            case 2:
                this.X = this.x+1;
                this.Y = this.y;
                break;
            case 3:
                this.X = this.x+1;
                this.Y = this.y+1;
                break;
            case 4:
                this.X = this.x;
                this.Y = this.y+1;
                break;
            case 5:
                this.X = this.x-1;
                this.Y = this.y+1;
                break;
            case 6:
                this.X = this.x-1;
                this.Y = this.y;
                break;
            case 7:
                this.X = this.x-1;
                this.Y = this.y-1;
                break;
        }
        if(op){
            return;
        }
        if(this.swordCol()){                //Checks if collide with orb
            var orb = field[this.Y][this.X];
            orb.strike();
            
        }
        statMove.innerHTML = ++moves;
        updateGame();
        }
    },
    swordCol: function(){                   //sword collision checking
        'use strict';
        var col = field[this.Y][this.X];
        for(var i = 0; i < roach.length; i++){
            if(this.Y == roach[i].y && this.X == roach[i].x){
                roach[i].alive = false;
            }
			
        }
        if(typeof col === 'object'){
            if(col.name === 'orb'){
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    checkCol: function(y,x){                //player collision checking
        'use strict';
        var col = field[this.y+y][this.x+x];
        for(var i = 0; i < roach.length; i++){
            if(this.y+y == roach[i].y && this.x+x == roach[i].x){
                return true;
            }
        }
        if(col === 1 || col === 4){
            return true;
        }
        if(typeof col === 'object'){
            if(col.name === 'orb'){
                return true;
            } else if (col.name === 'gate'){
                if(col.state == 1 || col.state == 'c'){
                    return true;
                } else {
                    return false;
                }
            }
        }
    }
};

function Roach(x,y,s){
    'use strict';
    this.x = x;                       //roach x
    this.y = y;                       //roach y
    this.alive = true;                //alive?
    this.state = s;                   //egg or roach
    this.hatch = 10;                   //hatch time and egg size
    this.type = 'roach';              //roach
    this.distance = function(){       //distance to player
        var dx = player.x - this.x;
        var dy = player.y - this.y;
		
        return Math.sqrt(dx * dx + dy * dy);
    };
    this.move = function(){                 //moves the roach towards player
        if(this.state != 1){                //moves only if not an egg
        ctx.clearRect(this.x*tile,this.y*tile,tile,tile);
        if(Math.floor(this.distance())==1){
            this.y = player.y;
            this.x = player.x;
            player.alive = false;
            return;
        }
        if(this.y > player.y){              //Roaches move vertical first
            if(!this.checkCol(-1,0)){       //standard vertical movement
                this.y -= 1;
            }
            else if(this.x > player.x){     //checks for diagonal movement
                if(!this.checkCol(-1,-1)){
                    this.y -=1;
                }
            }
            else if(this.x < player.x){
                if(!this.checkCol(-1,1)){
                    this.y -= 1;
                }
            }
        }
        else if(this.y < player.y){
            if(!this.checkCol(1,0)){
                this.y += 1;
            }
            else if(this.x > player.x){
                if(!this.checkCol(1,-1)){
                    this.y +=1;
                }
            }
            else if(this.x < player.x){
                if(!this.checkCol(1,1)){
                    this.y += 1;
                }
            }
        }
        if(this.x > player.x){              //roaches then move horizontally
            if(!this.checkCol(0,-1)){
                this.x -= 1;
            }
        }
        else if(this.x < player.x){
            if(!this.checkCol(0,1)){
                this.x += 1;
            }
        }
        }
    };
    this.checkCol = function(y,x){             //checks collision with the world
        var col = field[this.y+y][this.x+x];
        for(var i = 0; i < roach.length; i ++){//checks collision with roach     
            var check = roach[i];
            if(this.y + y == check.y && this.x + x == check.x){
                return true;
            }
        }
        if(this.y + y == player.Y && this.x +x == player.X){//sword collision
            return true;
        }
        if(col === 1 || col === 4){                          //wall collision
            return true;
        }
        if(typeof col === 'object'){            //object collision
            if(col.name === 'orb'){             //orb
                return true;
            } else if (col.name === 'gate'){    //door
                if(col.state == 1 || col.state == 'c'){//closed door
                    return true;
                } else {                        //open door
                    return false;
                }
            }
        }
    }
    this.draw = function(){                     //draws the roach
        if(this.state ==1){
            ctx.clearRect(this.x*tile,this.y*tile,tile,tile);
            ctx.fillStyle = "#404040";
            ctx.fillRect(this.x*tile + this.hatch,this.y*tile + this.hatch,tile - this.hatch * 2,tile - this.hatch * 2);
        } else {
            ctx.clearRect(this.x*tile,this.y*tile,tile,tile);
            ctx.fillStyle = "#404040";
            ctx.fillRect(this.x*tile,this.y*tile,tile,tile);
        }
    };
}

function RoachQueen(x,y){
    'use strict';
    this.x = x;                         //queen x
    this.y = y;                         //queen y
    this.type = 'queen';                //queen
    this.alive = true;                  //alive?
    this.distance = function(){         //distance to player
        var dx = player.x - this.x;
        var dy = player.y - this.y;
		
        return Math.sqrt(dx * dx + dy * dy);
    };
    this.lay = function(){              //lays eggs around itself
        for(var j = -1; j <= 1;  j++){
            for(var i = -1; i <= 1;i++){
                if(!this.checkCol(i,j,1)){
                    roach.push(new Roach(this.x+j,this.y+i,1))
                }
            }
        }
    }
    this.move = function(){                 //moves the roach away player
        ctx.clearRect(this.x*tile,this.y*tile,tile,tile);
        if(this.y > player.y){              //Roaches move vertical first
            if(!this.checkCol(1,0)){       //standard vertical movement
                this.y += 1;
            }
            else if(this.x > player.x){     //checks for diagonal movement
                if(!this.checkCol(1,1)){
                    this.y +=1;
                }
            }
            else if(this.x < player.x){
                if(!this.checkCol(1,-1)){
                    this.y += 1;
                }
            }
        }
        else if(this.y < player.y){
            if(!this.checkCol(-1,0)){
                this.y -= 1;
            }
            else if(this.x > player.x){
                if(!this.checkCol(-1,1)){
                    this.y -=1;
                }
            }
            else if(this.x < player.x){
                if(!this.checkCol(-1,-1)){
                    this.y -= 1;
                }
            }
        }
        if(this.x > player.x){              //roaches then move horizontally
            if(!this.checkCol(0,1)){
                this.x += 1;
            }
        }
        else if(this.x < player.x){
            if(!this.checkCol(0,-1)){
                this.x -= 1;
            }
        }        
        //this.draw()
    };
    this.checkCol = function(y,x,lay){             //checks collision with the world
        var col = field[this.y+y][this.x+x];
        for(var i = 0; i < roach.length; i ++){//checks collision with roach     
            var check = roach[i];
            if(this.y + y == check.y && this.x + x == check.x){
                return true;
            }
        }
        if(col === 1 || col === 4){                          //wall collision
            return true;
        }
        if(this.y + y == player.Y && this.x +x == player.X){//sword collision
            return true;
        }
        if(this.y + y == player.y && this.x +x == player.x){//player collision
            return true;
        }
        if(typeof col === 'object'){            //object collision
            if(col.name === 'orb'){             //orb
                return true;
            } else if (col.name === 'gate'){    //door
                if(col.state == 1 || col.state == 'c'){//closed door
                    return true;
                } else {                        //open door
                    if(lay == 1){
                        return true;
                    }
                    return false;
                }
            }
        }
    }
    this.draw = function(){                     //draws the roach
        ctx.clearRect(this.x*tile,this.y*tile,tile,tile);
        ctx.fillStyle = "#707070";
        ctx.fillRect(this.x*tile,this.y*tile,tile,tile);
        ctx.fillStyle = "#909090";
        ctx.fillRect(this.x*tile + 5,this.y*tile + 5,tile-10,tile-10);
    };
}

function Orb(operation){                        //orb object
    'use strict';
    this.name = 'orb';                          //for use in collision detection
    this.op = operation.slice();                //doors the orb operates on
    this.strike = function(){                   //Manipulates door
        for(var i = 0; i < gate.length; i += 1){
            var g = gate[i];
            for (var j = 0; j < this.op.length; j += 1){
                if(g.id == this.op[j].charAt(0)){
                   gate[i].door(this.op[j].charAt(1));
                }
            }
        }
    };
}

function Gate(id,state,x,y){        //gate object
    'use strict';
    this.name = 'gate';             //for use in collision detection
    this.id = id;                   //id that matches orb
    this.state = state;             //either open or closed
    this.x = x;
    this.y = y;
    this.door = function(op){       //handles door state
        if(op == 'o'){              //Opens gate
            this.state = 0;
        }
        else if (op == 'c'){        //closes gate
            this.state = 1;
        }
        else if (op == 'x'){        //open green gate
            this.state = op;
        } else {                    //Toggle between open and close
            this.state = 1 - this.state;
        }
        this.draw();
    };
    this.draw = function(){         //Drawing function
        if(this.state == 0){        //open gate
            fieldCtx.fillStyle = "#FFFFCC";
            fieldCtx.fillRect(this.x*tile,this.y*tile,tile,tile);
        }
        else if(this.state == 1){   //closed gate
            fieldCtx.fillStyle = "#FF9933";
            fieldCtx.fillRect(this.x*tile,this.y*tile,tile,tile);
        }
        else if(this.state == 'c'){ //closed room gate
            fieldCtx.fillStyle = "#009933";
            fieldCtx.fillRect(this.x*tile,this.y*tile,tile,tile);
        }
        else if(this.state == 'x'){ //open room gate
            fieldCtx.fillStyle = "#ccffcc";
            fieldCtx.fillRect(this.x*tile,this.y*tile,tile,tile);
        }
    };
}

//*** Game Builder ***\\
//draws entire room and creates new objects

function drawField(){
    'use strict';
    var color = 1;
    for(var i = 0; i < rows; i++){
        //color = 1 - color;
        for(var j = 0; j < cols; j++){
            color = 1 - color;
            if(typeof field[i][j] === 'string'){//converts strings to objects
                var s = field[i][j];
                if(s.startsWith('1')){  //changes 1 into orb object
                    s = s.substring(1).split(".")
                    field[i][j] = new Orb(s);
                    fieldCtx.fillStyle = "#0080FF";
                    fieldCtx.fillRect(j*tile,i*tile,tile,tile);
                }
                else if(s.startsWith('2')){ //changes 2 into gate object
                    field[i][j] = new Gate(s[1],s[2],j,i);
                    gate.push(field[i][j]);
                    field[i][j].draw();
                }
                else if(s.startsWith('p')){       //initializes player
                    s = s.substring(1);
                    player.init(j,i,parseInt(s));
                    if(color){
                        if(map > 16){			  //hard levels colours
                            fieldCtx.fillStyle = "#ccccff";                       
                        } else {
                            fieldCtx.fillStyle = "#EEEEEE";                        
                        }
                    } else {
                        if(map > 16){
                            fieldCtx.fillStyle = "#e6e6ff";                       
                        } else {
                            fieldCtx.fillStyle = "#FFFFFF";                        
                        }
                    }
                    fieldCtx.fillRect(j*tile,i*tile,tile,tile);
                }
                else if(s.startsWith('3')){       //changes into gate object
                    s = s.substring(1);
                    field[i][j] = new Gate('x',s,j,i);
                    gate.push(field[i][j]);
                    field[i][j].draw();
                }
            }
            if(field[i][j]==1){         //draws walls
                if(map > 16){
                    fieldCtx.fillStyle = "#000066";
                } else {
                    fieldCtx.fillStyle = "#CC66FF";
                }
                fieldCtx.fillRect(j*tile,i*tile,tile,tile);
            }
            if(field[i][j]==2){         //adds a new roach object
                if(color){
                    if(map > 16){
                        fieldCtx.fillStyle = "#ccccff";                       
                    } else {
                        fieldCtx.fillStyle = "#EEEEEE";                        
                    }
                } else {
                    if(map > 16){
                        fieldCtx.fillStyle = "#e6e6ff";                       
                    } else {
                        fieldCtx.fillStyle = "#FFFFFF";                        
                    }
                }
                fieldCtx.fillRect(j*tile,i*tile,tile,tile);
                roach.push(new Roach(j,i))
            }
            if(field[i][j]==3){         //adds a new roach queen object
                if(color){
                    if(map > 16){
                        fieldCtx.fillStyle = "#ccccff";                       
                    } else {
                        fieldCtx.fillStyle = "#EEEEEE";                        
                    }
                } else {
                    if(map > 16){
                        fieldCtx.fillStyle = "#e6e6ff";                       
                    } else {
                        fieldCtx.fillStyle = "#FFFFFF";                        
                    }
                }
                fieldCtx.fillRect(j*tile,i*tile,tile,tile);
                roach.push(new RoachQueen(j,i))
            }
            if(field[i][j]==4){         //draws other walls
                if(map > 16){
                    fieldCtx.fillStyle = "#d9266e";                       
                } else {
                fieldCtx.fillStyle = "#bf8040";                      
                }
                fieldCtx.fillRect(j*tile,i*tile,tile,tile);
            }
            if(field[i][j]==9){         //draws stairs
                fieldCtx.fillStyle = "#CCFFFF";
                fieldCtx.fillRect(j*tile,i*tile,tile,tile);
            }
            if(field[i][j]==0){         //checkerboard pattern
                if(color){
                    if(map > 16){
                        fieldCtx.fillStyle = "#ccccff";                       
                    } else {
                        fieldCtx.fillStyle = "#EEEEEE";                        
                    }
                } else {
                    if(map > 16){
                        fieldCtx.fillStyle = "#e6e6ff";                       
                    } else {
                        fieldCtx.fillStyle = "#FFFFFF";                        
                    }
                }
                fieldCtx.fillRect(j*tile,i*tile,tile,tile);
            }
        }
    }
    for(var i = 0; i < roach.length; i++){  //draws roaches
        roach[i].draw();
    }
}

//*** Game Logic Handler ***\\
//After player input, the game reacts by updating
//gate states, roach movement, hatching and then
//checking if player is dead

function updateGame(){                                //updates Game state
    'use strict';
    //sorts roaches from closest to furthest from player
    roach.sort(function(a,b){return a.distance()-b.distance()})
    timer--;
    for(var i = 0; i < roach.length; i++){
        if(!roach[i].alive){
            roach.splice(i,1);                        //removes roach from array
            statKill.innerHTML = ++kills;             //adds to kills stat
            if(!roach.length){                        //if the roach is dead
                for(var i = 0; i < gate.length; i++){
                    if(gate[i].id == 'x'){
                        gate[i].door('x');            //Opens green door
                    }
                }
                player.draw()
                return;                               //ensures no more roach
            }                                         //logic executes
            //continue;
        }
        if(roach[i] != null){
            if(roach[i].type == 'queen'){
                HUD();
            }
            if(timer == 0){                              //roach queen lays eggs
                if(roach[i].type == 'queen'){
                roach[i].lay();
                }
            }
            if(roach[i].type != 'queen'){                 //changes hatch time
                if(roach[i].state == 1){
                    roach[i].hatch -=2;
                    if(roach[i].hatch == -2){
                        roach[i].state = 0;               //changes roach state
                    }                                     // from egg to roach
                }
            }
            roach[i].move();
            roach[i].draw();
        }
        if(!player.alive){
			rand.currentTime = 0;					  //death sound
			rand.play();
            death = setInterval(curtain,10)
            return;                                   //skips player drawing
        }                                             //if the player is dead
    }
    if(timer == 0){                                  //resets timer
        timer = 30;
    }
    player.draw()
}

//displays current level and roach queen spawn cycle
function HUD(){
    'use strict';
    eff.clearRect(0,e.height - 20,e.width,e.height);
    eff.font = "15px Arial";
    eff.fillStyle = "#000000";
    if(map == 16){
        eff.fillText("The End",10,e.height-3);
        eff.fillText("Spawn Cycle: " + timer,e.width * 0.5 -70,e.height-3);
    }
    else if(map == 20){
        eff.fillText("The Real End",10,e.height-3);
    } else {
        eff.fillText("Level: " + (map  + 1),10,e.height-3);
        eff.fillText("Spawn Cycle: " + timer,e.width * 0.5 -70,e.height-3);
    }
}

//*** Animation ***\\

var death;
var wipe;
var winning;
var message;
var anim = 0;
var anim2= -10;


//Death curtain fall
function curtain(){ 
    'use strict';
    if(anim > rows){
        anim = 0;
    }
    eff.fillStyle = "#EA1010"
    eff.fillRect(0,anim * tile ,e.width,tile);
    anim += 1;
}

//restart wipe
function restart(){
    'use strict';
    if(anim > rows){
        eff.clearRect(0,anim2 * tile,e.width,tile);
        anim2 += 1;
        if(anim2 > rows){
            anim = 0;
            anim2 = -15;
            clearInterval(wipe);
            HUD()
        }
        return;
    }
    eff.fillStyle = "#808080";
    eff.fillRect(0,anim * tile,e.width,tile);
    anim +=1;
}
function ending(){
	'use strict';
	if(anim > rows){
        clearInterval(message);
        anim = 0;
        anim2 = -15;
		eff.fillStyle = "#E0E0E0"
		eff.font = "18px Arial";
        if(map < 17){
            eff.fillText("And with that, the Second Smitemaster left the hold thinking the",50,80);
            eff.fillText("puzzle was just too overwhelming and left the roach queen",65,100);
            eff.fillText("to her business. Who knows what lies ahead.",125,120);
        } else {
            eff.fillText("\"All of that work for a longer staircase. Should've left when I could.\"",50,80);
            eff.fillText("The Second Smitemaster pondered whether or not this was worth",50,100);
            eff.fillText("the trouble. And with that, the Second Smitemaster opens a",65,120);
            eff.fillText("roach burger restaurant and made serious bank.",110,140);

        }
        eff.font = "40px Arial";
        var stat = 180;
        var num  = stat + 200
        eff.fillText("Stats", e.width * 0.5 -60,190)
        eff.fillText("Push 'R' to play again",120,e.height - 60);
        eff.font = "18px Arial";
        eff.fillText("Total Moves:", stat,240);
        eff.fillText(moves, num,240);
        eff.fillText("Total Restarts:", stat,260);
        eff.fillText(deaths, num,260);
        eff.fillText("Total Kills:", stat,280);
        eff.fillText(kills, num,280);
        return;
	}
    eff.fillStyle = "#808080";
    eff.fillRect(0,anim * tile,e.width,tile);
    anim +=1;
}

//moves the player down the stairs until at the end
function win(){
    'use strict';
    if(player.y == 23){
        clearInterval(winning);
        ctx.clearRect(player.x*tile,player.y*tile,tile,tile);
        ctx.clearRect(player.X*tile,player.Y*tile,tile,tile);
		message = setInterval(ending,30)
       return;
    }
    ctx.clearRect(player.x*tile,player.y*tile,tile,tile);
    ctx.clearRect(player.X*tile,player.Y*tile,tile,tile);
    player.y++;
    player.Y++;
    player.draw();
}
