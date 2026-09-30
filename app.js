const statusEl = document.getElementById('status');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const markerImg = document.getElementById('markerImg');
const illustration = document.getElementById('illustration');
const startButton = document.getElementById('startButton');

const W = 320;
const H = 240;
canvas.width = W;
canvas.height = H;

let template = null;
let running = false;
let lastCheck = 0;
let hitCount = 0;

function status(text) { statusEl.textContent = text; }

function gray(data, i) {
  return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
}

function makeTemplate() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const cctx = c.getContext('2d', { willReadFrequently: true });
  cctx.drawImage(markerImg, 0, 0, 64, 64);
  const d = cctx.getImageData(0, 0, 64, 64).data;
  template = new Float32Array(64 * 64);
  for (let i = 0; i < 64 * 64; i++) {
    template[i] = gray(d, i * 4);
  }
  console.log('[AR] Template created.');
}

function findMarker() {
  if (!template || video.readyState < 2) return false;

  try {
    ctx.drawImage(video, 0, 0, W, H);
    const source = ctx.getImageData(0, 0, W, H).data;

    let best = 0;
    const sizes = [52, 72, 92, 110];

    for (const size of sizes) {
      for (let y = 0; y <= H - size; y += 14) {
        for (let x = 0; x <= W - size; x += 14) {
          let diff = 0;
          let count = 0;

          for (let ty = 0; ty < 64; ty++) {
            for (let tx = 0; tx < 64; tx++) {
              const sx = Math.min(W - 1, x + Math.floor(tx * size / 64));
              const sy = Math.min(H - 1, y + Math.floor(ty * size / 64));
              const idx = (sy * W + sx) * 4;
              const v = gray(source, idx);
              diff += Math.abs(v - template[ty * 64 + tx]);
              count++;
            }
          }

          const score = 1 - diff / (count * 1.4);
          best = Math.max(best, score);
        }
      }
    }

    return best > 0.75;
  } catch (error) {
    console.error('[AR] Find marker error:', error);
    return false;
  }
}

function loop(now) {
  if (now - lastCheck > 210) {
    lastCheck = now;
    const found = findMarker();
    hitCount = found ? hitCount + 1 : 0;

    if (hitCount >= 2) {
      illustration.classList.add('show');
      status('✓ マーカーを認識しました');
    } else if (!found) {
      illustration.classList.remove('show');
      status('🔍 マーカーを探索中…');
    }
  }
  requestAnimationFrame(loop);
}

async function startCamera() {
  startButton.hidden = true;
  status('カメラを起動中…');
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('このページではカメラが利用できません');

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });

    video.srcObject = stream;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    await new Promise(resolve => {
      if (video.readyState >= 1) resolve();
      else video.addEventListener('loadedmetadata', resolve, { once: true });
    });

    await video.play();

    if (markerImg.complete) {
      makeTemplate();
      status('🔍 マーカーを探索中…');
      if (!running) {
        running = true;
        requestAnimationFrame(loop);
      }
    } else {
      markerImg.onload = () => {
        makeTemplate();
        status('🔍 マーカーを探索中…');
        if (!running) {
          running = true;
          requestAnimationFrame(loop);
        }
      };
    }
  } catch (error) {
    console.error('[AR] Camera error:', error);
    startButton.hidden = false;
    status('カメラを開始できません。ボタンを押してください');
  }
}

startButton.addEventListener('click', startCamera);
startCamera();
