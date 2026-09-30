const statusEl = document.getElementById('status');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function updateStatus(msg) {
    statusEl.textContent = msg;
    console.log(msg);
}

// Canvas をウィンドウサイズに合わせる
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ビデオキャプチャ開始
async function startCamera() {
    try {
        updateStatus('カメラを起動中...');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = stream;
        video.play();
        updateStatus('カメラ起動完了 - マーカーを探索中...')
        video.addEventListener('loadedmetadata', () => {
            updateStatus('カメラ準備完了');
            renderLoop();
        }, { once: true });
    } catch (err) {
        updateStatus('❌ カメラエラー: ' + err.message);
        console.error(err);
    }
}

// レンダリングループ
function renderLoop() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(renderLoop);
}

startCamera();
