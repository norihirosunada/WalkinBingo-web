let pieces = new Array(9);
let pictureWindow;
const lines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
let bingoFlag = new Array(8);

let bingoCard = [];
let resultText, scoreText;

let capture;
let facingUser = true;
let constraints;
const userConstraints = {
  video: {
    facingMode: 'user'
  },
  audio: false
};
const envConstraints = {
  video: {
    facingMode: {
    exact: 'environment'
    }
  },
  audio: false
};

let img;
let foundLabel;
let classifier;
let includeLabel = false;
// let hitPieces = [];

const classes = ["acoustic guitar", "airship", "ambulance", "analog clock", "bakery, bakeshop, bakehouse", "balloon", "ballpoint, ballpoint pen, ballpen, Biro", "Band Aid", "baseball", "basketball", "birdhouse", "boathouse", "bookshop, bookstore, bookstall", "bottlecap", "broom", "bullet train, bullet", "butcher shop, meat market", "candle, taper, wax light", "canoe", "castle", "chain", "china cabinet, china closet"];
let table;
let subjects;
const test_subjects = ["ballpoint", "analog clock", "balloon", "birdhouse", "boathouse", "bookshop", "bottlecap", "canoe", "castle"];

function preload() {
  table = loadTable("/assets/MOBILENET_CLASSES.csv", "csv", "header");
  subjects = loadTable("/assets/SUBJECTS.csv", "csv", "header");
  // console.table(table);
}

function setup() {
  // スマホ・PC判定
  // TODO: NavigatorUADataがSafariでも使えるようになったらいいね
  console.log(`isMobile: ${isMobile()}`);
  
  noCanvas();
  
  // ビンゴカード準備
  randomSeed(99);
  let allSubs = subjects.getColumn("subject")
  let subs = [...Array(subjects.getRowCount())].map((_, i) => i);
  for (let i = 0; i < subs.length; i++) {
    let tmp = floor(random(subs.length));
    let swp = subs[i];
    subs[i] = subs[tmp];
    subs[tmp] = swp;
  }
  const subjectsToday = subs.slice(0,9).map(num => allSubs[num]);
  console.log(subjectsToday);
  for(let i=0; i < pieces.length; i++) {
    const boxDiv = select("#box"+i);
  	let box = createGraphics(boxDiv.width, boxDiv.height);
  	box.parent(boxDiv);
  	box.show();
  	const isCenter = i == 4;
    pieces[i] = new Piece(box, subjectsToday[i], isCenter);
    // box.child(pieces[i]);
  }
  
  const cameraDiv = select("#cameraDiv");
  constraints = isMobile() ? envConstraints : userConstraints
  capture = createCapture(constraints, function(stream) {
    console.log(stream);
    console.log(`capture:`);
    console.log(capture);
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
  
  if (isMobile) {
    flipButton.removeAttribute("disabled");
  }
}

function draw() {
  pieces.forEach(piece => piece.display());
  pictureWindow.display();
}

function isMobile(){
  var md = new MobileDetect(window.navigator.userAgent);
  return md.mobile() != null;
}

function listMediaDevices() {
	navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
    devices.forEach(function(device) {
      console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
    });
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
  });
}

function flipCamera() {
  facingUser = !facingUser;
  console.log(facingUser);
  // stopCapture();
  capture.remove();
  if(facingUser) {
   constraints = userConstraints;
  } else {
   constraints = envConstraints;
  }
  capture = createCapture(constraints);
  capture.hide();
}

function modelReady() {
  console.log('Model Ready');
  select("#shutterButton").removeAttribute("disabled");
  // classifyVideo();
}

function classifyVideo() {
  // let pWidth = min(capture.size().width, capture.size().height);
  // let posX = (capture.size().width - pWidth) / 2;
  // img = capture.get(posX, 0, pWidth, pWidth);
  img = capture.get();
  
  classifier.classify(gotResult,1);
}

function gotResult(error, results) {
  if (error) {
    console.error(error);
  }
  // resultsはconfidence降順
  console.log(results[0].label);
  const foundClass = split(results[0].label, ',')[0];
  // const row = table.findRow(foundClass, "class");
  foundLabel = table.findRow(results[0].label, "class").getString("level1_ja");
  let foundLabel_ja = table.findRow(results[0].label, "class").getString("class_split_ja");
  console.log(foundLabel);
  let confidence = round(results[0].confidence * 100);
  
  pictureWindow.showResults(results);
  
  capture = createCapture(constraints);
  capture.hide();
  
  includeLabel = pieces.some(piece => piece.word == foundLabel);
  
  // select(".modal-title").html(`You found ${foundLabel_ja}`);
  select("#foundLabel").html(foundLabel_ja);
	select("#confidenceBar").html(`${confidence}%`);
  select("#confidenceBar").attribute("aria-valuenow", confidence);
  select("#confidenceBar").style("width", `${confidence}%`);
	if(includeLabel) {
		// select("#includeLabelText").addClass("d-none");
		select("#okButton").removeClass("d-none");
	} else {
		// select("#includeLabelText").removeClass("d-none");
		select("#okButton").addClass("d-none");
	}
}

function setPicture() {
  console.log("setPicture");
  const hitPieces = pieces.filter(piece => piece.word == foundLabel);
  hitPieces.forEach(piece => piece.picture = img);
}

function setModalImage() {
  const modalImage = select("#modalImage");
  let modalImageGraphic = createGraphics(modalImage.width, modalImage.height);
  modalImageGraphic.parent(modalImage);
  modalImageGraphic.Image(img);
}

function checkBingo() {
  // ビンゴ判定
  // 各ビンゴパターンチェック
  lines.forEach((indices, bingoIndex) => {
    // ビンゴマス取得
    const line = pieces.filter((_, index) => indices.includes(index));
    if(line.every(piece => piece.picture !== undefined)) {
      console.log("Bingo"+indices);
      bingoFlag[bingoIndex] = true;
      resultText.html("Bingo!");
      // let bingo = select("#bingo");
      // bingo.removeClass("invisible");
    }
  });
}

class Piece {
  constructor(canvas, word, isCenter){
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.word = word;
    this.isCenter = isCenter;
    
    this.bg = createGraphics(200, 200);
    this.bg.stroke(40);
    this.bg.fill(255);
    this.bg.rect(4, 4, this.bg.width-8, this.bg.height-8);
    
    this.canvas.textAlign(CENTER);
    this.canvas.textSize(14);
    this.canvas.imageMode(CENTER);
    this.canvas.translate(this.width/2, this.height/2);
  }
  
  display() {
    if(this.picture) {
      this.canvas.image(this.picture, 0, 0, this.width, this.height, this.posX, this.posY, this.dWidth, this.dWidth);
    }
    this.canvas.text(this.isCenter ? "?" : this.word, 0, 0);
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
    this.width = canvas.width;
    this.height = canvas.height;
    this.found = 'searching...';
    
    this.bg = createGraphics(this.width, this.height);
    this.bg.stroke(40);
    this.bg.fill(255);
    this.bg.rect(4, 4, this.bg.width-8, this.bg.height-8);
    
    this.canvas.fill(200);
    this.canvas.textSize(24);
    this.canvas.textAlign(CENTER);
    this.canvas.imageMode(CENTER);
    this.canvas.translate(this.width/2, this.height/2);
    this.canvas.rectMode(CENTER);
    
    this.sqSize = this.width/4;
    this.dSize = 0;
    this.a = 0;
  }
  
  display() {
    // this.setDisplayPos();
    this.canvas.image(capture, 0, 0);
    // this.canvas.image(capture, 0, 0, this.width, this.height, this.posX, this.posY, this.dWidth, this.dHeight);
    
    // インジケータ　収縮する角丸枠
    this.a += 0.02;
    this.dSize = 16 * sin(this.a);
    push();
    this.canvas.noFill()
    this.canvas.stroke(240);
    this.canvas.strokeWeight(6);
    // 右下
    this.canvas.beginShape();
    this.canvas.vertex(this.sqSize + this.dSize, this.sqSize + this.dSize - 40);
    this.canvas.quadraticVertex(this.sqSize + this.dSize, this.sqSize + this.dSize, this.sqSize + this.dSize - 40, this.sqSize + this.dSize);
    this.canvas.endShape();
    // 左下
    this.canvas.beginShape();
    this.canvas.vertex(-this.sqSize - this.dSize, this.sqSize + this.dSize - 40);
    this.canvas.quadraticVertex(-this.sqSize - this.dSize, this.sqSize + this.dSize, -this.sqSize - this.dSize + 40, this.sqSize + this.dSize);
    this.canvas.endShape();
    // 左上
    this.canvas.beginShape();
    this.canvas.vertex(-this.sqSize - this.dSize, -this.sqSize - this.dSize + 40);
    this.canvas.quadraticVertex(-this.sqSize - this.dSize, -this.sqSize - this.dSize, -this.sqSize - this.dSize + 40, -this.sqSize - this.dSize);
    this.canvas.endShape();
    // 右上
    this.canvas.beginShape();
    this.canvas.vertex(this.sqSize + this.dSize, -this.sqSize - this.dSize + 40);
    this.canvas.quadraticVertex(this.sqSize + this.dSize, -this.sqSize - this.dSize, this.sqSize + this.dSize - 40, -this.sqSize - this.dSize);
    this.canvas.endShape();
    pop();
  }
  
  setDisplayPos() {
    this.dWidth = min(capture.width, capture.height);
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
  
  indicator(){
    
  }
}

// 画面サイズとキャンバスサイズを合わせる
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
