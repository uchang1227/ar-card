const statusEl = document.getElementById('status');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const markerImg = document.getElementById('markerImg');
const illustration = document.getElementById('illustration');

const W = 320;
const H = 240;
let template = null;
let running = false;
let lastCheck = 0;
let hitCount = 0;

function status(text) {
  statusEl.textContent = text;
}

function gray(data, i) {
  return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
}

function makeTemplate() {
  const c = document.createElement('canvas');
  c.width = 40; c.height = 40;
  const cctx = c.getContext('2d', { willReadFrequently: true });
  cctx.drawImage(markerImg, 0, 0, 40, 40);
  const d = cctx.getImageData(0, 0, 40, 40).data;
  template = new Float32Array(1600);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) template[y * 40 + x] = gray(d, (y * 40 + x) * 4);
}

// 軽量な確認用。画面全体を毎フレーム処理せず、約4回/秒だけ調べます。
function findMarker() {
  if (!template || video.readyState < 2) return false;
  ctx.drawImage(video, 0, 0, W, H);
  const source = ctx.getImageData(0, 0, W, H).data;
  let best = 0;
  for (let size of [50, 70, 90, 110]) {
    for (let y = 0; y <= H - size; y += 18) {
      for (let x = 0; x <= W - size; x += 18) {
        let diff = 0;
        for (let ty = 0; ty < 40; ty += 2) for (let tx = 0; tx < 40; tx += 2) {
          const sx = Math.min(W - 1, x + Math.floor(tx * size / 40));
          const sy = Math.min(H - 1, y + Math.floor(ty * size / 40));
          diff += Math.abs(gray(source, (sy * W + sx) * 4) - template[ty * 40 + tx]);
        }
        best = Math.max(best, 1 - diff / (400 * 2));
      }
    }
  }
  return best > 0.82;
}

function loop(now) {
  if (now - lastCheck > 250) {
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

async function start() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    video.srcObject = stream;
    await video.play();
    markerImg.onload = () => {
      makeTemplate();
      status('🔍 マーカーを探索中…');
      if (!running) { running = true; requestAnimationFrame(loop); }
    };
    if (markerImg.complete) markerImg.onload();
  } catch (error) {
    console.error(error);
    status('カメラを利用できません。Safariの許可を確認してください');
  }
}

start();
