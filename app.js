const statusEl = document.getElementById('status');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const markerImg = document.getElementById('markerImg');
const illustration = document.getElementById('illustration');
const startButton = document.getElementById('startButton');

function status(text) { statusEl.textContent = text; }

async function startCamera() {
  startButton.hidden = true;
  status('カメラを起動中…');
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('このページではカメラを利用できません');
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
    status('🔍 マーカーを探索中…');
    // 現段階ではまずカメラ映像を安定表示します。
    // カメラ映像が表示できたことを確認後、認識処理を追加します。
  } catch (error) {
    console.error(error);
    startButton.hidden = false;
    status('カメラを開始できません。ボタンを押してください');
  }
}

startButton.addEventListener('click', startCamera);
startCamera();
