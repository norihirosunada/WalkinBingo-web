let pieces = new Array(9);
let pictureWindow;

let bingoCard = [];
let resultText, scoreText;

let capture;
let facingUser = true;
let constraints = {
  video: {
    facingMode: 'user'
  },
  audio: false
};

let img;
let classifier;

const classes = ["acoustic guitar", "airship", "ambulance", "analog clock", "bakery, bakeshop, bakehouse", "balloon", "ballpoint, ballpoint pen, ballpen, Biro", "Band Aid", "baseball", "basketball", "birdhouse", "boathouse", "bookshop, bookstore, bookstall", "bottlecap", "broom", "bullet train, bullet", "butcher shop, meat market", "candle, taper, wax light", "canoe", "castle", "chain", "china cabinet, china closet"];

const test_subjects = ["ballpoint", "analog clock", "balloon", "birdhouse", "boathouse", "bookshop", "bottlecap", "canoe", "castle"];

function preload() {
  // let url = "./IMAGENET_CLASSES.json";
  // classes = loadJSON(url);
  
}

function setup() {
  noCanvas();
	
  let size = bingoCard.width/3;
  
  for(let i=0; i < pieces.length; i++) {
    const boxDiv = select("#box"+i);
  	let box = createGraphics(boxDiv.width, boxDiv.height);
  	box.parent(boxDiv);
  	box.show();
    pieces[i] = new Piece(box, test_subjects[i]);
    // box.child(pieces[i]);
  }
  
  const cameraDiv = select("#cameraDiv");
  capture = createCapture(constraints, function(stream) {
    console.log(stream);
  });
  capture.hide();
  console.log(classes);
  
  let videoGraphic = createGraphics(cameraDiv.width, cameraDiv.height);
  videoGraphic.parent(cameraDiv);
  videoGraphic.show();
  pictureWindow = new PictureWindow(videoGraphic);
  // pictureWindow.center();
  
  classifier = ml5.imageClassifier('MobileNet', capture, modelReady);
  
  const flipButton = select("#flipButton");
  flipButton.mousePressed(flipCamera);
  
  const shutterButton = select("#shutterButton");
  shutterButton.mousePressed(pictureWindow.getPicture);
  
  resultText = select("#resultText");
  scoreText = select("#scoreText");
}

function draw() {
  pieces.forEach(piece => piece.display());
  pictureWindow.display();
}

function flipCamera() {
  facingUser = !facingUser;
  console.log(facingUser);
  // stopCapture();
  capture.remove();
  if(facingUser) {
   constraints = {
     video: {
         facingMode: {
          exact: 'user'
        }
     },
     audio: false
   };

  } else {
   constraints = {
     video: {
         facingMode: {
          exact: 'environment'
        }
     },
     audio: false
   };
  }
  capture = createCapture(constraints);
  capture.hide();
}

function modelReady() {
  console.log('Model Ready');
  // classifyVideo();
}

function classifyVideo() {
  // let pWidth = min(capture.size().width, capture.size().height);
  // let posX = (capture.size().width - pWidth) / 2;
  // img = capture.get(posX, 0, pWidth, pWidth);
  img = capture.get();
  
  classifier.classify(gotResult,1);
}

// A function to run when we get any errors and the results
function gotResult(error, results) {
  // Display error in the console
  if (error) {
    console.error(error);
  }
  // The results are in an array ordered by confidence.
  pictureWindow.showResults(results);
  
  capture = createCapture(constraints);
  capture.hide();
  
  pieces.forEach(piece => {
    if(piece.word == split(results[0].label, ',')[0]) {
        piece.picture = img;
      }
  });
  
  // ビンゴ判定
  console.table(pieces);
  const lines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
  lines.forEach(indices => {
    const line = pieces.filter((_, index) => indices.includes(index));
    if(line.every(piece => piece.picture !== undefined)) {
      console.log("Bingo"+indices);
      resultText.html("Bingo!")
    }
  });
}

class Piece {
  constructor(canvas, word){
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.width = canvas.width;
    this.height = canvas.height;
    this.word = word;
    
    this.bg = createGraphics(200, 200);
    this.bg.stroke(40);
    this.bg.fill(255);
    this.bg.rect(4, 4, this.bg.width-8, this.bg.height-8);
    
    this.canvas.textAlign(CENTER);
  }
  
  display() {
    // this.canvas.image(this.bg, this.x, this.y, this.width, this.height);
    
    if(this.picture) {
      this.canvas.image(this.picture, this.x, this.y, 200, 200, this.posX, this.posY, this.dWidth, this.dWidth);
    }
    this.canvas.text(this.word, this.x + this.width/2, this.y + this.height/2);
  }
  
  get picture() {
    return this._picture;
  }
  
  set picture(pic) {
    this._picture = pic;
    this.dWidth = min(pic.width, pic.height);
    let diffWidthHeight = abs(pic.width - pic.height);
    this.posX = (pic.width > pic.height) ? diffWidthHeight/2 : 0;
    this.posY = (pic.width < pic.height) ? diffWidthHeight/2 : 0;
  }
  
  found(label) {
    return label == this.word;
  }
}

class PictureWindow {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.width = canvas.width;
    this.height = canvas.height;
    this.found = 'searching...';
    
    this.bg = createGraphics(this.width, this.height);
    this.bg.stroke(40);
    this.bg.fill(255);
    this.bg.rect(4, 4, this.bg.width-8, this.bg.height-8);
    // this.bg.mousePressed(aaa);
    
    // this.uiPosY = (this.height - this.width)/2 + this.width + windowHeight;
    
    // this.h1 = createElement('h1', 'searching...');
    // this.h1.style('text-align', 'center');
    // this.h1.position(0, this.uiPosY);
    // this.h1.size(width, AUTO);
    // this.h1.center();
    this.canvas.fill(200);
    this.canvas.textSize(24);
    this.canvas.textAlign(CENTER);
  }
  
  display() {
    // image(capture, this.x + 6, this.y + 6, this.width - 12, this.width-12, 80, 0, this.capture.size().width*2, this.capture.size().height*2);
    this.setDisplayPos();
    this.canvas.image(capture, this.x, this.y, this.width, this.width, this.posX, this.posY, this.dWidth, this.dHeight);
    // this.canvas.image(capture, 0, 0);

    // this.canvas.text(this.found, this.width/2, this.uiPosY - 40);

    // this.canvas.text("hoge", this.width/2, this.height/2);
  }
  
  setDisplayPos() {
    this.dWidth = min(capture.width, capture.height);
    // this.dHeight = dWidth * capture.width / capture.height
    let diffWidthHeight = abs(capture.width - capture.height)/2;
    this.posX = (capture.width > capture.height) ? diffWidthHeight : 0;
    this.posY = (capture.width < capture.height) ? diffWidthHeight : 0;
  }
  
  getPicture() {
    classifyVideo();
  }
  
  showResults(results) {
    this.results = results;
    console.log(results);
    console.log('Label: ' + results[0].label);
    console.log('Confidence: ' + nf(results[0].confidence, 0, 2));
    this.found = `you found ${split(results[0].label, ',')[0]}`;
  }
}

// 画面サイズとキャンバスサイズを合わせる
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
