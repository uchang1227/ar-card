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

function status(text) { statusEl.textContent = text; console.log('[AR] ' + text); }

function gray(data, i) {
  return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
}

function makeTemplate() {
  const c = document.createElement('canvas');
  c.width = 50; c.height = 50;
  const cctx = c.getContext('2d', { willReadFrequently: true });
  cctx.drawImage(markerImg, 0, 0, 50, 50);
  const d = cctx.getImageData(0, 0, 50, 50).data;
  template = new Float32Array(2500);
  for (let i = 0; i < 2500; i++) template[i] = gray(d, i * 4);
  console.log('[AR] Template created, size: ' + template.length);
}

function findMarker() {
  if (!template || video.readyState < 2) return false;
  
  try {
    ctx.drawImage(video, 0, 0, W, H);
    const source = ctx.getImageData(0, 0, W, H).data;
    
    let best = 0;
    const sizes = [45, 60, 75, 90];
    const step = 25;
    
    for (let size of sizes) {
      for (let y = 0; y <= H - size; y += step) {
        for (let x = 0; x <= W - size; x += step) {
          let diff = 0;
          let count = 0;
          
          // テンプレート(50x50)をリサイズして比較
          for (let ty = 0; ty < 50; ty++) {
            for (let tx = 0; tx < 50; tx++) {
              const sx = Math.min(W - 1, x + Math.floor(tx * size / 50));
              const sy = Math.min(H - 1, y + Math.floor(ty * size / 50));
              const idx = (sy * W + sx) * 4;
              const v = gray(source, idx);
              diff += Math.abs(v - template[ty * 50 + tx]);
              count++;
            }
          }
          
          const score = 1 - (diff / count);
          best = Math.max(best, score);
        }
      }
    }
    
    return best > 0.70;
  } catch (e) {
    console.error('[AR] Detection error:', e);
    return false;
  }
}

function loop(now) {
  if (now - lastCheck > 200) {
    lastCheck = now;
    const found = findMarker();
    
    if (found) {
      hitCount++;
      if (hitCount >= 2) {
        illustration.classList.add('show');
        status('✓ マーカー認識中！');
      }
    } else {
      if (hitCount > 0) {
        hitCount--;
      } else {
        illustration.classList.remove('show');
        status('🔍 マーカーを探索中…');
      }
    }
  }
  requestAnimationFrame(loop);
}

async function startCamera() {
  startButton.hidden = true;
  status('カメラを起動中…');
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('このデバイスではカメラが利用できません');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    stream.getVideoTracks().forEach(track => { track.enabled = true; });
    video.srcObject = stream;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    
    await new Promise(resolve => {
      if (video.readyState >= 1) resolve();
      else video.addEventListener('loadedmetadata', resolve, { once: true });
    });
    
    await video.play();
    status('✓ カメラ起動完了');
    
    // マーカーテンプレートを読み込む
    if (markerImg.complete) {
      makeTemplate();
      status('🔍 マーカーを探索中…');
      if (!running) { running = true; requestAnimationFrame(loop); }
    } else {
      markerImg.onload = () => {
        makeTemplate();
        status('🔍 マーカーを探索中…');
        if (!running) { running = true; requestAnimationFrame(loop); }
      };
    }
  } catch (error) {
    console.error('[AR] Error:', error);
    startButton.hidden = false;
    status('エラー: ' + error.message);
  }
}

startButton.addEventListener('click', startCamera);
startCamera();
