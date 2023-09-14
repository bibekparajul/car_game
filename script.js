// Initializing the board
let boardWidth = 400;
let boardHeight = 680;
let context;
let gameOver = false;
let score = 0;
let highestScore = 0;
let collisionCount = 0;
let collidedThisFrame = false; // Flag to track if collision occurred in the current frame
let gamePaused = false; // Flag to track if the game is paused
let savedState = {}; // Object to store the game state
let enemyCarInterval;

// For Car
let carHeight = 100;
let carWidth = 50;
let carPosX = boardWidth / 2.3;
let carPosY = boardHeight - 130;
let carImage;
var carPassedSound = new Audio('./assets/audio_point.ogg'); 
var bulletSound = new Audio('./assets/wing.ogg')
var coinCollideSound = new Audio('./assets/die.ogg')
var carCollideSound = new Audio('./assets/hit.ogg')

// For enemy Car
let enemyCarArr = [];
let enemyCarWidth = 50;
let enemyCarHeight = 100;
let enemyCarPosX = boardWidth / 8;
let enemyCarPosY = boardHeight / 2;
let enemyCarImage = [
  './assets/enemycar.png',
  './assets/enemycar2.png',
  './assets/enemycar3.png',
];

// For lives
let lives = 3;
const heartImage = new Image();
heartImage.src = './assets/heart.png';
const heartSize = 40;
const heartSpacing = 10;
const livesPosX = 130;
const livesPosY = 30;

// For bullet 
let bulletImage = new Image()
bulletImage.src = "./assets/bullet.png"
let bulletSize = 20;
let bullets = [];

// For coin
let coinArr = [];
let coinImage = new Image()
coinImage.src = './assets/coin.png'
let coinSize = 40;
let coinInterval;      

// For moving the enemy car in vertical down direction
let velocityY = 3;
// For moving the car in left and right direction
let velocityX = 0;
// For moving the car in the upward direction
let acceleration = 0;

// Creating the Car object
let car = {
  x: carPosX,
  y: carPosY,
  width: carWidth,
  height: carHeight
};

window.onload = function () {
  let board = document.getElementById('backBoard');
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d");

  // Drawing dashed line in vertical
  setLane();
  // Placing the car image
  carImage = new Image(); // Create the new instance of the car
  carImage.src = './assets/myCar.png';
  // Now Loading the car image
  carImage.onload = function () {
    context.drawImage(carImage, car.x, car.y, car.width, car.height);
  };

  // Loading enemy car image only for single enemy car
  // enemyCarImage = new Image();
  // enemyCarImage.src = './assets/enemyCar.png';

  // Updating the frame after the refresh
  // Helps optimizing animations and other visual changes in web applications.
   var anId = requestAnimationFrame(updateFrames);
   anId;

  // Cars are generated every 1 seconds
  enemyCarInterval = setInterval(setEnemy, 1500);
  coinInterval = setInterval(setCoin,4000)

  // Making the car move in left and right direction
  document.addEventListener("keydown", moveCar);
  document.addEventListener("keyup", stopCar);
  

};

// Function to update the frames of the canvas
function updateFrames() {
  requestAnimationFrame(updateFrames);

  // If game over, then reset the frame
  if (gameOver) {
    drawLives();
    return;
  }
  difficultyLevel();


  if (gamePaused) {
    // Draw the paused message
    context.fillStyle = "white";
    context.font = "40px Arial";
    context.fillText("Paused", boardWidth / 2 - 60, boardHeight / 2);
    cancelAnimationFrame(anId);
  }


  // After updating the previous frame should be cleared; otherwise, frames would overlap
  context.clearRect(0, 0, boardWidth, boardHeight);

// Drawing two line in vertical
  setLane()
  // For our car
  car.x = Math.max(Math.min(car.x + velocityX, boardWidth - car.width), 0);
  car.y = Math.max(Math.min(car.y + acceleration, boardHeight - car.height), 0);
  context.drawImage(carImage, car.x, car.y, car.width, car.height);

  // For enemy car
  for (let i = 0; i < enemyCarArr.length; i++) {
    let enemyCar = enemyCarArr[i];
    enemyCar.y += velocityY;
    context.drawImage(enemyCar.img, enemyCar.x, enemyCar.y, enemyCar.width, enemyCar.height);

    // Updating the score based on colision
    if (!enemyCar.isPassed && car.y < enemyCar.y - car.height && !enemyCar.collided) {
      score += 1;
      enemyCar.isPassed = true;
      carPassedSound.play();
      console.log(carPassedSound)
      highestScores()
    }

    
 if (!collidedThisFrame && detectCollision(car, enemyCar)) {
      collidedThisFrame = true; // Set the flag to true
      if (collisionCount >= 3) {
        gameOver = true;
        highestScores()      // High scores are updated when the game is over
      }
    }
  }
  
  // For coin 
  for (let i = 0; i < coinArr.length; i++) {
    let coin = coinArr[i];
    coin.y += velocityY;
    context.drawImage(coin.img, coin.x, coin.y, coin.width, coin.height);

    // Collision of car with coin
    if(!coin.isPassed && coinCollision(car,coin)){
      score += 10;
      coin.isPassed = true;
      coinArr.splice(i,1)
      highestScores()
    }
 
  }
  collidedThisFrame = false

  // For drawing and updating the lives the lives
  drawLives();

  // Updating and drawing the bullets in canvas
  updateBullets()
  drawBullets()

  // Score Sheet
  context.fillStyle = "white";
  context.font = "18px sans-serif";
  context.fillText("💰 " + score, 5, 20);
  context.fillText("High Score " + highestScore, 272, 20);

  // Showing the gameover
  if (gameOver) {
    drawLives();
    context.fillStyle = "white";
    context.fillText("GAME OVER", 5, 50);
    // Increase font size and change font family for the second text
    context.font = "40px Arial";
  context.fillText("Press W to Continue", 10, 320);
  }
}

// Function to set enemy cars
function setEnemy() {
  if (gameOver) {
    return;
  }

  let randomCarX1 = Math.random() * (boardWidth - enemyCarWidth); // Random x position for the first enemy car
  let randomCarX2;
  
  // Generate a different x position for the second enemy car that does not overlap with the first one
  do {
    randomCarX2 = Math.random() * (boardWidth - enemyCarWidth);
  } while (Math.abs(randomCarX2 - randomCarX1) < enemyCarWidth);

  let randomCarImage = enemyCarImage[Math.floor(Math.random() * enemyCarImage.length)]; // Random enemy car image

  let enCar1 = {
    img: new Image(),
    x: randomCarX1,
    y: -enemyCarHeight, // Start from the top of the board
    height: enemyCarHeight,
    width: enemyCarWidth,
    isPassed: false,
    collided: false // Flag to track if collision occurred with this car
  };

  let enCar2 = {
    img: new Image(),
    x: randomCarX2,
    y: -enemyCarHeight, // Start from the top of the board
    height: enemyCarHeight,
    width: enemyCarWidth,
    isPassed: false,
    collided: false // Flag to track if collision occurred with this car
  };

  enCar1.img.src = randomCarImage;
  enCar2.img.src = randomCarImage;

  enemyCarArr.push(enCar1, enCar2);
}

// Function to set the coins
function setCoin(){
  let randomCoinX1 = Math.random() * (boardWidth - enemyCarWidth); // Random x position for the first coin 
let coin1 = {
  img: coinImage,
  x: randomCoinX1,
  y: -enemyCarHeight,
  height:coinSize,
  width:coinSize,
  isPassed: false,
  collided: false
}
coinArr.push(coin1)
}


// Function to move the car
function moveCar(e) {
  if (e.code == "KeyA") {
    velocityX = -5;
    if(score>5){
      velocityX = -6;
    }
  }
  else if (e.code == "KeyD") {
    velocityX = 5;
    if(score>5){
      velocityX = 6;
    }
  }
  else if (e.code == "KeyW") {
    acceleration = -5;
    if(score>5){
      acceleration = -6;
    }
    if (gameOver){
      resetGame();
    } 
  }
  else if (e.code == "KeyS") {
    acceleration = 5;
    if(score>5){
      acceleration = 6;
    }
  }
  else if (e.code == "Space") {
    fireBullet();
  }
  else if(e.code == "KeyP"){
    pauseGame();
  }
  else if(e.code == "KeyR"){
    resumeGame();
  }
}

// Function to stop car
function stopCar(e) {
  if (e.code == "KeyA" || e.code == "KeyD") {
    velocityX = 0;
    if (score > 5) {
      velocityX = 0;
    }
  } else if (e.code == "KeyW" || e.code == "KeyS") {
    acceleration = 0;
    if (score > 5) {
      acceleration = 0;
    }
    if (gameOver) {
      resetGame();
    }
  }
}


// Function to reset game after ganeOver
function resetGame(){
    car.y = carPosY;
    enemyCarArr = [];
    score = 0;
    collisionCount = 0; // Reset collision count
    gameOver = false;
    lives = 3
}

// Function to detect collision of a car with coin
function coinCollision(car,coin){
  if (
    car.x < coin.x + coin.width &&
    car.x + car.width > coin.x &&
    car.y < coin.y + coin.height &&
    car.y + car.height > coin.y
  ) {
    if (!coin.collided) {
      coin.collided = true;
      coinCollideSound.play()
    }
    return true;
  }
  return false;
}

// Function to detect the collision
function detectCollision(car1, car2) {
  if (
    car1.x < car2.x + car2.width &&
    car1.x + car1.width > car2.x &&
    car1.y < car2.y + car2.height &&
    car1.y + car1.height > car2.y
  ) {
    if (!car2.collided && !car1.isFire) {
      car2.collided = true;
      collisionCount++; // Increment collision count
      lives--; // Decrease lives by one
      console.log("Number of collisions: " + collisionCount);
      console.log("Lives remaining: " + lives);
      carCollideSound.play()
      
    }
    return true;
  }
  return false;
}

// Function to increase the difficulty level when the score increases
function difficultyLevel(){
  if (score<50){
    velocityY = 3;
  }
  else if(score>=50 && score<100 ){
    velocityY = 5;
  }
  else if(score>=100){
    velocityY = 7;
  }
}

// Function to draw the lives
function drawLives() {
  for (let i = 0; i < lives; i++) {
    const x = livesPosX + (heartSize + heartSpacing) * i;
    const y = livesPosY;
    context.drawImage(heartImage, x, y, heartSize, heartSize);
  }
}

// Function to define lane
function setLane(){
  // Drawing dashed line in vertical
  context.setLineDash([20, 10]); // Dashed line should be 5 pixels long and 5 pixels gap
  context.beginPath();
  context.lineWidth = 8; 
  context.moveTo(boardWidth / 3, 0); // Initial Line
  context.lineTo(boardWidth / 3, boardHeight); // Ending line
  context.strokeStyle = "yellow";
  context.stroke(); // This is the line to draw the line in the canvas
  context.beginPath();
  context.lineWidth = 8;
  context.moveTo(boardWidth / 1.5, 0); // Initial Line
  context.lineTo(boardWidth / 1.5, boardHeight); // Ending line
  context.strokeStyle = "yellow";
  context.stroke(); // This is the line to draw the line in the canvas
}

// Function to update the highest score 
function highestScores(){
  if(score> highestScore){
    highestScore = score;
  }
}

// Function to fire a bullet
function fireBullet() {
  let bullet = {
    x: car.x + car.width / 2 - bulletSize / 2, // Bullet position is set inside the car
    y: car.y,
    width: bulletSize,
    height: bulletSize,
    velocityY: -5, // Set the bullet's upward velocity
    isFire: true   // This key is introduced so that the lives doesnot decrease when a bullet collides the enemy car
  };
  bullets.push(bullet);
  bulletSound.play(); 
}

// Function to update bullets positions and check for collisions
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.y += bullet.velocityY;

    // Check collision with enemy cars
    for (let j = 0; j < enemyCarArr.length; j++) {
      let enemyCar = enemyCarArr[j];
      if (detectCollision(bullet, enemyCar)) {
        // After the collision remove both the bullet and enemyCar from the array
        bullets.splice(i, 1); 
        enemyCarArr.splice(j, 1); 
        score++; // Increment the score
        break;
      }
    }

    // Remove bullets that go off-screen
    if (bullet.y < 0) {
      bullets.splice(i, 1);
    }
  }
}

// Function to draw the bullets
function drawBullets() {
  for (let i = 0; i < bullets.length; i++) {
    let bullet = bullets[i];
    context.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

// Function to pause the game
function pauseGame() {
  if (!gameOver && !gamePaused) {
    gamePaused = true; // Set the gamePaused flag to true
    cancelAnimationFrame(updateFrames)
    // clearing should be done otherwise the array gets maximum
    clearInterval(enemyCarInterval);
    clearInterval(coinInterval);
    savedState = {
      score: score,
      carPosX: car.x,
      carPosY: car.y,
      enemyCarArr: [...enemyCarArr] // Create a copy of the enemy car array
    };
  }
}

// Function to resume the game
function resumeGame() {
  if (gamePaused) {
    gamePaused = false; 
    gameOver = false; 
    // Restore the saved state
    score = savedState.score;
    car.x = savedState.carPosX;
    car.y = savedState.carPosY;
    enemyCarArr = [...savedState.enemyCarArr];

    enemyCarInterval = setInterval(setEnemy, 1500); // Start generating enemy cars again
    coinInterval = setInterval(setCoin,4000)
    updateFrames; // Start updating frames again
  }
}


