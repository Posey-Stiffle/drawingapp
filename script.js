var img;
var initials = 'jm';
var choice = '1';
var screenbg = 250;
var lastscreenshot = 61;

let layer;
let undoStack = [];
const UNDO_LIMIT = 25;

let brushColor;
let brushSize = 6;
let rainbowHue = 0;

// background cooldown
let lastBgChange = 0;
const BG_COOLDOWN = 500; // 5 seconds

function preload() {
  img = loadImage('https://dma-git.github.io/images/74.png');
}

function setup() {
  createCanvas(1200, 800); // larger canvas
  layer = createGraphics(1200, 800);
  background(screenbg);
  brushColor = color(0);
  setBrushFromKey('1');
  lastBgChange = -BG_COOLDOWN; // allow first background change immediately
}

function draw() {
  if (keyIsPressed) {
    choice = key;
    clear_print();
    special_keys();
  }

  if (mouseIsPressed) {
    if (choice !== '9') newkeyChoice(choice);
  }

  background(screenbg);
  image(layer, 0, 0);
}

/* ------------ tools -------------- */
function newkeyChoice(toolChoice) {
  layer.noFill();
  layer.noStroke();

  const usingEraser = (toolChoice === '-');

  if (toolChoice >= '1' && toolChoice <= '4') {
    setBrushFromKey(toolChoice);
  }

  if (toolChoice === '1' || toolChoice === '2' || toolChoice === '3' || toolChoice === '4' || toolChoice === '-') {
    // make eraser use biggest brush size
    const currentSize = usingEraser ? 40 : brushSize;
    layer.stroke(usingEraser ? color(screenbg) : brushColor);
    layer.strokeWeight(currentSize);
    layer.line(mouseX, mouseY, pmouseX, pmouseY);

  } else if (toolChoice === '6') {
    const s = random(8, 28);
    const c = color(random(255), random(255), random(255), 110);
    layer.noStroke();
    layer.fill(c);
    layer.rect(mouseX - s / 2, mouseY - s / 2, s, s);

  } else if (toolChoice === '7') {
    const radius = brushSize * 2;
    layer.noStroke();
    layer.fill(brushColor);
    for (let i = 0; i < 15; i++) {
      const a = random(TWO_PI);
      const r = random(radius);
      const dx = cos(a) * r;
      const dy = sin(a) * r;
      layer.circle(mouseX + dx, mouseY + dy, 1 + brushSize * 0.25);
    }

  } else if (toolChoice === '8') {
    layer.noStroke();
    const c = color(red(brushColor), green(brushColor), blue(brushColor), 80);
    layer.fill(c);
    const steps = max(1, int(dist(mouseX, mouseY, pmouseX, pmouseY) / (brushSize * 0.6)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = lerp(pmouseX, mouseX, t);
      const y = lerp(pmouseY, mouseY, t);
      layer.circle(x, y, brushSize * 2);
    }

  } else if (toolChoice === '0') {
    layer.noStroke();
    const ang = radians(25);
    const w = brushSize * 2.4;
    const h = brushSize * 1.1;
    const steps = max(1, int(dist(mouseX, mouseY, pmouseX, pmouseY) / (brushSize * 0.5)));
    const c = color(red(brushColor), green(brushColor), blue(brushColor), 220);
    layer.fill(c);
    layer.push();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = lerp(pmouseX, mouseX, t);
      const y = lerp(pmouseY, mouseY, t);
      layer.translate(x, y);
      layer.rotate(ang);
      layer.ellipse(0, 0, w, h);
      layer.rotate(-ang);
      layer.translate(-x, -y);
    }
    layer.pop();

  } else if (toolChoice === 'g' || toolChoice === 'G') {
    layer.image(img, mouseX, mouseY, 50, 50);
  }
}

/* ------------ helpers -------------- */
function setBrushFromKey(k) {
  if (k === '1') brushSize = 4;
  else if (k === '2') brushSize = 12;
  else if (k === '3') brushSize = 24;
  else if (k === '4') brushSize = 40;
}

function special_keys() {
  // 5 = random brush color
  if (key === '5') {
    brushColor = color(random(255), random(255), random(255));
  }

  // 9 = change background at most once every 5 seconds
  if (key === '9') {
    const now = millis();
    if (now - lastBgChange >= BG_COOLDOWN) {
      screenbg = color(random(255), random(255), random(255));
      lastBgChange = now;
    }
  }
}

function clear_print() {
  if (key === 'x' || key === 'X') {
    layer.clear();
    background(screenbg);
  } else if (key === 'p' || key === 'P') {
    saveme();
  } else if (key === '+') {
    undo();
  }
}

function pushUndo() {
  const snap = layer.get();
  undoStack.push(snap);
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
}

function undo() {
  if (undoStack.length > 0) {
    const snap = undoStack.pop();
    layer.clear();
    layer.image(snap, 0, 0);
  }
}

function saveme() {
  filename = initials + day() + hour() + minute() + second();
  if (second() != lastscreenshot) {
    saveCanvas(filename, 'jpg');
    key = '';
  }
  lastscreenshot = second();
}

function mousePressed() {
  if (key !== '+' && key !== 'x' && key !== 'X' && key !== 'p' && key !== 'P') {
    pushUndo();
  }
}
