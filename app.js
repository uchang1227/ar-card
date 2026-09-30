const statusEl = document.getElementById('status');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let markerDetected = false;
let illustrationImage = null;

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

// イラスト画像を事前読み込み
function loadIllustration() {
    illustrationImage = new Image();
    illustrationImage.src = 'illustration.png';
    illustrationImage.onload = () => {
        updateStatus('✓ イラスト読み込み完了');
    };
    illustrationImage.onerror = () => {
        updateStatus('✗ イラスト読み込みエラー');
    };
}

// マーカー検出のためのシンプルな色検出（黒い部分を探す）
function detectMarker(imageData) {
    const data = imageData.data;
    let blackPixels = 0;
    const threshold = 50; // 黒と判定する閾値

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // グレースケール値が閾値以下なら黒
        if (r < threshold && g < threshold && b < threshold) {
            blackPixels++;
        }
    }

    // 画像全体の15%以上が黒ければマーカーと判定
    const blackRatio = blackPixels / (data.length / 4);
    return blackRatio > 0.15;
}

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
        loadIllustration();
        updateStatus('✓ カメラ起動完了 - マーカーを探索中...');
        
        video.addEventListener('loadedmetadata', () => {
            renderLoop();
        }, { once: true });
    } catch (err) {
        updateStatus('✗ カメラエラー: ' + err.message);
        console.error(err);
    }
}

// レンダリングループ
function renderLoop() {
    // ビデオをキャンバスに描画
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // マーカー検出
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    markerDetected = detectMarker(imageData);

    // マーカーが検出されたらイラストを表示
    if (markerDetected && illustrationImage) {
        const imgWidth = 250;
        const imgHeight = 250;
        const x = (canvas.width - imgWidth) / 2;
        const y = (canvas.height - imgHeight) / 2;
        
        // イラストを中央に描画
        ctx.drawImage(illustrationImage, x, y, imgWidth, imgHeight);
        updateStatus('✓ マーカー検出中！');
    } else {
        updateStatus('🔍 マーカーを探索中...');
    }

    requestAnimationFrame(renderLoop);
}

startCamera();
