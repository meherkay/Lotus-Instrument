// LOTUS — Play It By Key | Option A: Make an Instrument
// Press A S D F G H J or click/tap a lotus. Every trigger is logged to console.

const KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j'];
const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
const FREQUENCIES = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
const COLORS = [
  [236, 143, 171], [243, 168, 172], [244, 182, 156],
  [241, 163, 191], [215, 151, 204], [198, 156, 218], [235, 160, 194]
];
let flowers = [], particles = [];
let audioContext = null;
let soundOn = true, audioReady = false, sceneW = 1000, sceneH = 460;
let stars = [];

function setup() {
  const holder = document.getElementById('canvas-container') || document.body;
  sceneW = holder.clientWidth;
  sceneH = constrain(sceneW * 0.47, 380, 560);
  const canvas = createCanvas(sceneW, sceneH);
  canvas.parent('canvas-container');
  pixelDensity(1);
  angleMode(RADIANS);
  textFont('DM Sans');
  for (let i = 0; i < 7; i++) flowers.push({ bloom: 0.09, target: 0.09, pulse: 0, last: -100, phase: random(TWO_PI) });
  for (let i = 0; i < 65; i++) stars.push({x:random(1),y:random(1),s:random(.5,1.7),phase:random(TWO_PI)});
  const muteButton = document.getElementById('mute');
  if (muteButton) muteButton.addEventListener('click', () => {
    soundOn = !soundOn;
    muteButton.textContent = soundOn ? '♫ SOUND ON' : '♫ SOUND OFF';
    muteButton.setAttribute('aria-pressed', String(!soundOn));
  });
}

function initSound() {
  if (audioContext) {
    if (audioContext.state === 'suspended') audioContext.resume();
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext = new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume();
}

function playTone(frequency) {
  if (!audioContext || !soundOn) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.23);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 1.08);
}

function flowerPosition(i) {
  const x = sceneW * (0.09 + i * (0.82 / 6));
  const y = sceneH * (0.52 + (i % 2 === 0 ? -0.045 : 0.06));
  return { x, y };
}

function triggerFlower(i) {
  if (i < 0 || i >= 7) return;
  console.log(`Lotus played: ${KEYS[i].toUpperCase()} — ${NOTES[i]} (${FREQUENCIES[i]} Hz)`);
  initSound();
  flowers[i].target = 1;
  flowers[i].pulse = 1;
  flowers[i].last = millis();
  playTone(FREQUENCIES[i]);
  const p = flowerPosition(i);
  for (let k = 0; k < 16; k++) {
    const a = random(TWO_PI), speed = random(0.6, 2.8);
    particles.push({ x:p.x, y:p.y, vx:cos(a)*speed, vy:sin(a)*speed-0.5, life:1, c:COLORS[i] });
  }
}

function keyPressed() {
  const i = KEYS.indexOf(String(key).toLowerCase());
  if (i !== -1) { triggerFlower(i); return false; }
}
function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  for (let i = 0; i < 7; i++) {
    const p = flowerPosition(i);
    if (dist(mouseX, mouseY, p.x, p.y) < min(sceneW * 0.075, 82)) {
      triggerFlower(i); return false;
    }
  }
}
function touchStarted() {
  // On touch devices, p5 usually synthesizes mousePressed; avoid triggering twice.
  return true;
}
function keyReleased() {
  const i = KEYS.indexOf(String(key).toLowerCase());
  if (i !== -1) flowers[i].target = 0.13;
}

function draw() {
  background(20, 24, 35);
  noStroke();
  // Atmospheric background glow
  for (let r = 6; r >= 1; r--) {
    fill(91, 50, 86, 2.6);
    ellipse(width/2, height*.54, width*.2*r, height*.16*r);
  }
  for (const s of stars) {
    fill(245, 195, 214, 45 + 35*sin(frameCount*.014+s.phase));
    circle(s.x*width, s.y*height, s.s);
  }
  stroke(181, 123, 153, 30);
  line(width*.04, height*.79, width*.96, height*.79);
  noStroke();
  const scaleFactor = min(sceneW / 1100, 1.1);
  for (let i = 0; i < 7; i++) {
    const f = flowers[i];
    if (millis() - f.last > 850) f.target = 0.12;
    f.bloom = lerp(f.bloom, f.target, 0.065);
    f.pulse *= 0.955;
    const p = flowerPosition(i);
    const sway = (mouseX / max(1, width) - .5) * .13 + sin(frameCount*.015 + f.phase)*.035;
    drawLotus(p.x, p.y, f.bloom, f.pulse, COLORS[i], sway, scaleFactor);
    const active = f.bloom > .3;
    textAlign(CENTER, CENTER);
    textSize(constrain(width/82, 11, 15));
    textStyle(BOLD);
    fill(active ? color(255, 219, 230) : color(183, 163, 178));
    text(KEYS[i].toUpperCase(), p.x, height*.86);
    textStyle(NORMAL);
    textSize(constrain(width/105, 9, 12));
    fill(138, 125, 141);
    text(NOTES[i], p.x, height*.91);
  }
  for (let i = particles.length-1; i>=0; i--) {
    let p = particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=.018; p.life-=.025;
    noStroke(); fill(...p.c, max(0,p.life)*160);
    circle(p.x,p.y, max(0,p.life)*3.5);
    if(p.life<=0) particles.splice(i,1);
  }
}

function drawLotus(x, y, bloom, pulse, rgb, sway, sc) {
  push(); translate(x,y); rotate(sway); scale(sc);
  const spread = easeOutCubic(bloom);
  // Radiant halo
  noStroke();
  for (let r=5; r>=1; r--) {
    fill(...rgb, (pulse*9+spread*3)*(6-r));
    circle(0,0, (65+r*29)*(1+spread*.32));
  }
  // Stem and leaf-like foundation
  stroke(99, 142, 121, 115); strokeWeight(2);
  noFill(); bezier(0,20, -5,44, 9,67, 1,110);
  noStroke();
  fill(74, 120, 104, 130);
  ellipse(-20,30,39,10); ellipse(20,30,39,10);
  // Outer petals (closed: upright; open: rotate outward)
  for (let layer=0; layer<3; layer++) {
    const count = layer===0 ? 7 : (layer===1 ? 6 : 5);
    for(let j=0; j<count; j++) {
      const t = count===1 ? 0 : j/(count-1);
      const centered = t*2-1;
      const rotation = centered * (0.12 + spread*(layer===0 ? 1.35 : layer===1 ? .92 : .50));
      const shift = abs(centered) * spread * (layer===0 ? 29 : layer===1 ? 17 : 8);
      push(); translate(centered*shift, layer===0 ? 10 : layer===1 ? 5 : 0);
      rotate(rotation);
      const len = layer===0 ? 79 : layer===1 ? 70 : 59;
      const w = layer===0 ? 25 : layer===1 ? 23 : 19;
      const light = layer===0 ? -.09 : layer===1 ? .04 : .16;
      const c = rgb.map(v=>constrain(v+(255-v)*light,0,255));
      fill(...c, 215); stroke(255, 216, 224, 55); strokeWeight(.75);
      beginShape();
      vertex(0, 13);
      bezierVertex(-w*1.1,-len*.15,-w*.93,-len*.72,0,-len);
      bezierVertex(w*.93,-len*.72,w*1.1,-len*.15,0,13);
      endShape(CLOSE);
      stroke(255,236,237,50); strokeWeight(.7);
      line(0,7,0,-len*.7);
      pop();
    }
  }
  noStroke();
  fill(255, 205, 142, 130+100*spread);
  ellipse(0,6, 15+6*spread, 8+3*spread);
  fill(255, 231, 163, 140+90*spread);
  for(let i=0;i<7;i++) {
    const a=TWO_PI*i/7;
    circle(cos(a)*6*spread,6+sin(a)*3*spread,2.6);
  }
  pop();
}
function easeOutCubic(t) { return 1-pow(1-constrain(t,0,1),3); }
function windowResized() {
  sceneW = (document.getElementById('canvas-container') || document.body).clientWidth;
  sceneH = constrain(sceneW*.47,380,560);
  resizeCanvas(sceneW,sceneH);
}
