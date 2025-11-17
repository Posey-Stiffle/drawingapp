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
  // preload() runs once
  img = loadImage('https://dma-git.github.io/images/74.png');
}

function setup() {
  createCanvas(600, 400);
  layer = createGraphics(600, 400);
  background(screenbg);
  brushColor = color(0); // black by default
  setBrushFromKey('1');  // initialize size
}

function draw() {
  // key handling
  if (keyIsPressed) {
    choice = key;          // set current tool to key pressed
    clear_print();         // handle clear / save / undo
    special_keys();        // handle color randomizer (5) etc.
  }

  // draw while dragging
  if (mouseIsPressed) {
    newkeyChoice(choice);
  }

  // compose to screen
  background(screenbg);
  image(layer, 0, 0);
}

/* ------------ tools -------------- */
function newkeyChoice(toolChoice) {
  // Draw onto the layer, not the main canvas
  layer.noFill();
  layer.noStroke();

  // compute stroke color for current tool
  const usingEraser = (toolChoice === '-');

  // map brushes 1–4 to sizes
  if (toolChoice >= '1' && toolChoice <= '4') {
    setBrushFromKey(toolChoice);
  }

  // tool implementations
  if (toolChoice === '1' || toolChoice === '2' || toolChoice === '3' || toolChoice === '4' || toolChoice === '-') {
    // Basic round brush or Eraser
    layer.stroke(usingEraser ? color(screenbg) : brushColor);
    layer.strokeWeight(brushSize);
    layer.line(mouseX, mouseY, pmouseX, pmouseY);

  } else if (toolChoice === '6') {
    // Random translucent squares
    const s = random(8, 28);
    const c = color(random(255), random(255), random(255), 110);
    layer.noStroke();
    layer.fill(c);
    layer.rect(mouseX - s/2, mouseY - s/2, s, s);

  } else if (toolChoice === '7') {
    // Spray paint (random dots in a radius)
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
    // Soft round marker (semi-transparent filled circles)
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

  } else if (toolChoice === '9') {
    // Rainbow line (cycles colors)
    colorMode(HSB, 360, 100, 100, 255);
    const rainbow = color((rainbowHue % 360), 90, 90, 255);
    colorMode(RGB, 255, 255, 255, 255);
    layer.stroke(rainbow);
    layer.strokeWeight(max(2, brushSize));
    layer.line(mouseX, mouseY, pmouseX, pmouseY);
    rainbowHue += 2;

  } else if (toolChoice === '0') {
    // Calligraphy oval brush (angled ovals along path)
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
    // place the preloaded image
    layer.image(img, mouseX, mouseY, 50, 50);
  }
}

/* ------------ helpers -------------- */
function setBrushFromKey(k) {
  // 1 smallest, 2 middle, 3 bigger, 4 biggest
  if (k === '1') brushSize = 4;
  else if (k === '2') brushSize = 12;
  else if (k === '3') brushSize = 24;
  else if (k === '4') brushSize = 40;
}

function special_keys() {
  // 5: randomize brush color (no drawing)
  if (key === '5') {
    brushColor = color(random(255), random(255), random(255));
  }
}

function clear_print() {
  // x clears; p saves; + undoes
  if (key === 'x' || key === 'X') {
    layer.clear();
    background(screenbg);
  } else if (key === 'p' || key === 'P') {
    saveme();  // from template
  } else if (key === '+') {
    undo();
  }
}

function pushUndo() {
  // store current layer snapshot
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

/* Save behavior from template */
function saveme(){
  // saves with initials + date/time
  filename = initials + day() + hour() + minute() + second();
  if (second() != lastscreenshot) {
    saveCanvas(filename, 'jpg');
    key = "";
  }
  lastscreenshot = second();
}

/* Mouse hooks to manage undo snapshots */
function mousePressed() {
  // Take a snapshot BEFORE a new stroke (only for drawing tools)
  // Skip for '+' (undo), 'x' (clear), 'p' (save)
  if (key !== '+' && key !== 'x' && key !== 'X' && key !== 'p' && key !== 'P') {
    pushUndo();
  }
}
