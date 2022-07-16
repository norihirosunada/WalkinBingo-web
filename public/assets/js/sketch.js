let pieces = [];
let pictureWindow;

let p1;
let bingoCard = [];

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
  var canvas = createCanvas(windowWidth, windowHeight*2);
  canvas.parent('canvas');
  background(220);
  let size = width/3;
  
  for(i=0; i<3; i++) {
    for(j=0; j<3; j++) {
      p1 = new Piece(j*size, i*size, size, size, test_subjects[i*3+j]);
      pieces[i*3+j] = p1;
    }
  }
  
  a = createGraphics(100, 100);
  // a.mousePressed(aaa);
  a.background(100);
  image(a, 300, 300);
  
  pictureWindow = new PictureWindow(0, windowHeight, width, windowHeight);
  // pictureWindow.center();
  
  capture = createCapture(constraints, function(stream) {
    console.log(stream);
  });
  capture.hide();
  console.log(classes);
  
  classifier = ml5.imageClassifier('MobileNet', capture, modelReady);
  
//   button = createButton('click me');
//   button.position(width/2 - button.width/2, 500);
//   // button.mousePressed(takePicture);
  
//   button2 = createButton('save');
//   button2.position(width/2 - button2.width/2 + 100, 500);
//   button2.mousePressed(_ => {
//     // saveCanvas(a);
//     console.log(pictureWindow.getPicture());
//   });
}

function draw() {
  background(220);
  
  for(i=0; i<3; i++) {
    for(j=0; j<3; j++) {
      pieces[i*3+j].display();
    }
  }
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
  
  for(i=0; i<3; i++) {
    for(j=0; j<3; j++) {
      if(pieces[i*3+j].word == split(results[0].label, ',')[0]) {
        pieces[i*3+j].picture = img;
      }
    }
  }
}

class Piece {
  constructor(x, y, width, height, word){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.word = word;
    
    this.bg = createGraphics(200, 200);
    this.bg.stroke(40);
    this.bg.fill(255);
    this.bg.rect(4, 4, this.bg.width-8, this.bg.height-8);
    // this.bg.mousePressed(aaa);
    
//     this.picture;
    
  }
  
  display() {
    image(this.bg, this.x, this.y, this.width, this.height);    
    
    if(this.picture) {
      image(this.picture, this.x, this.y, 200, 200, this.posX, this.posY, this.dWidth, this.dWidth);
    }
    text(this.word, this.x + this.width/2, this.y + this.height/2);
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
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.found = 'searching...';
    
    this.bg = createGraphics(this.width, this.height);
    this.bg.stroke(40);
    this.bg.fill(255);
    this.bg.rect(4, 4, this.bg.width-8, this.bg.height-8);
    // this.bg.mousePressed(aaa);
    
    this.uiPosY = (this.height - this.width)/2 + this.width + windowHeight;
    
    this.flipButton = createButton("flip");
    this.flipButton.position(width/2 - this.flipButton.width/2 + 100, this.uiPosY - this.flipButton.height/2);
    this.flipButton.mousePressed(flipCamera);
    
    this.shutterButton = createButton("◉");
    this.shutterButton.position(width/2 - this.shutterButton.width/2, this.uiPosY - this.shutterButton.height/2);
    this.shutterButton.mousePressed(this.getPicture);
    
    // this.h1 = createElement('h1', 'searching...');
    // this.h1.style('text-align', 'center');
    // this.h1.position(0, this.uiPosY);
    // this.h1.size(width, AUTO);
    // this.h1.center();
    
    textSize(24);
    textAlign(CENTER);
  }
  
  display() {
    // image(this.bg, this.x, this.y);
    // image(capture, this.x + 6, this.y + 6, this.width - 12, this.width-12, 80, 0, this.capture.size().width*2, this.capture.size().height*2);
    // image(capture, this.x, this.y, );
    this.setDisplayPos();
    image(capture, this.x, this.y, this.width, this.width, this.posX, this.posY, this.dWidth, this.dHeight);

    text(this.found, width/2, this.uiPosY - 40);
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
