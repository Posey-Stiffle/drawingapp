var img;
var initials = 'jm'; // your initials
var choice = '1';    // starting tool
var screenbg = 250;  // off white background
var lastscreenshot = 61; // last screenshot never taken

// --- drawing state ---
let layer;                 // offscreen buffer we draw on
let undoStack = [];        // stack of snapshots for undo
const UNDO_LIMIT = 25;

let brushColor;
let brushSize = 6;         // default; will be set by 1–4 keys
let rainbowHue = 0;

function preload() {
  img = loadImage('https://dma-git.github.io/images/74.png');
}

function setup() {
  createCanvas(1200, 800); // larger canvas
  layer = createGraphics(1200, 800);
  background(screenbg);
  brushColor = color(0); // black default
  setBrushFromKey('1');  // initialize size
}

function draw() {
  // key handling
  if (keyIsPressed) {
    choice = key;          // current tool = pressed key
    clear_print();         // handle clear/save/undo
    special_keys();        // handle random color, background change
  }

  // drawing
  if (mouseIsPressed) {
    newkeyChoice(choice);
  }

  // display the drawing
  background(screenbg);
  image(layer, 0, 0);
}

/* ------------ tools -------------- */
function newkeyChoice(toolChoice) {
  layer.noFill();
  layer.noStroke();

  const usingEraser = (toolChoice === '-');

  // map 1–4 to sizes
  if (toolChoice >= '1' && toolChoice <= '4') {
    setBrushFromKey(toolChoice);
  }

  // 1–4 = brushes / eraser
  if (toolChoice === '1' || toolChoice === '2' || toolChoice === '3' || toolChoice === '4' || toolChoice === '-') {
    layer.stroke(usingEraser ? color(screenbg) : brushColor);
    layer.strokeWeight(brushSize);
    layer.line(mouseX, mouseY, pmouseX, pmouseY);

  } else if (toolChoice === '6') {
    // random translucent squares
    const s = random(8, 28);
    const c = color(random(255), random(255), random(255), 110);
    layer.noStroke();
    layer.fill(c);
    layer.rect(mouseX - s/2, mouseY - s/2, s, s);

  } else if (toolChoice === '7') {
    // spray paint
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
    // soft marker
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
    // calligraphy oval brush
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

  } else if (toolChoice === '9') {
    // change background color to random
    screenbg = color(random(255), random(255), random(255));
    background(screenbg);

  } else if (toolChoice === 'g' || toolChoice === 'G') {
    // place preloaded image
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

function saveme(){
  filename = initials + day() + hour() + minute() + second();
  if (second() != lastscreenshot) {
    saveCanvas(filename, 'jpg');
    key = "";
  }
  lastscreenshot = second();
}

function mousePressed() {
  if (key !== '+' && key !== 'x' && key !== 'X' && key !== 'p' && key !== 'P') {
    pushUndo();
  }
}
