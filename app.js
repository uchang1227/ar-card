const statusEl = document.getElementById('status');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const illustration = document.getElementById('illustration');
const markerImg = document.getElementById('markerImg');

let markerTemplate = null;
let isMarkerDetected = false;
let detectionCount = 0;

function updateStatus(msg) {
    statusEl.textContent = msg;
    console.log('[AR Card] ' + msg);
}

// Canvas をウィンドウサイズに合わせる
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// マーカー画像をテンプレートとして読み込む
function loadMarkerTemplate() {
    return new Promise((resolve) => {
        markerImg.onload = () => {
            // キャンバスにマーカーを描画してテンプレートを取得
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 100;
            tempCanvas.height = 100;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(markerImg, 0, 0, 100, 100);
            markerTemplate = tempCtx.getImageData(0, 0, 100, 100);
            updateStatus('✓ マーカーテンプレート読み込み完了');
            resolve();
        };
        markerImg.onerror = () => {
            updateStatus('✗ マーカー画像読み込みエラー');
            resolve();
        };
    });
}

// 画像の類似度を計算（簡易版）
function calculateSimilarity(imageData1, imageData2) {
    if (!imageData1 || !imageData2) return 0;
    
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    const len = Math.min(data1.length, data2.length);
    
    let diff = 0;
    for (let i = 0; i < len; i += 4) {
        const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
        const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];
        
        const gray1 = (r1 + g1 + b1) / 3;
        const gray2 = (r2 + g2 + b2) / 3;
        
        diff += Math.abs(gray1 - gray2);
    }
    
    return 1 - (diff / (len / 4) / 255);
}

// マーカー検出
function detectMarker() {
    if (!markerTemplate) return false;

    // ビデオの一部をキャンバスに描画
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 複数の位置でマーカー検出を試みる
    const sampleSize = 100;
    const step = 50;
    let maxSimilarity = 0;
    
    for (let y = 0; y < canvas.height - sampleSize; y += step) {
        for (let x = 0; x < canvas.width - sampleSize; x += step) {
            const imageData = ctx.getImageData(x, y, sampleSize, sampleSize);
            const similarity = calculateSimilarity(imageData, markerTemplate);
            maxSimilarity = Math.max(maxSimilarity, similarity);
        }
    }
    
    return maxSimilarity > 0.6; // 類似度が60%以上でマーカー検出
}

// レンダリングループ
function renderLoop() {
    // マーカー検出
    const detected = detectMarker();
    
    if (detected) {
        detectionCount++;
        if (detectionCount > 5) { // 5フレーム連続検出で判定
            if (!isMarkerDetected) {
                isMarkerDetected = true;
                illustration.classList.add('show');
                updateStatus('✓ マーカー検出中！');
            }
        }
    } else {
        detectionCount = 0;
        if (isMarkerDetected) {
            isMarkerDetected = false;
            illustration.classList.remove('show');
            updateStatus('🔍 マーカーを探索中...');
        }
    }
    
    requestAnimationFrame(renderLoop);
}

// カメラ起動
async function startCamera() {
    try {
        updateStatus('カメラを起動中...');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        
        video.srcObject = stream;
        video.addEventListener('play', () => {
            updateStatus('✓ カメラ起動完了');
            loadMarkerTemplate().then(() => {
                updateStatus('🔍 マーカーを探索中...');
                renderLoop();
            });
        }, { once: true });
        
    } catch (err) {
        updateStatus('✗ カメラエラー: ' + err.message);
        console.error(err);
    }
}

startCamera();
