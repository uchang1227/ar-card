const statusEl = document.getElementById('status');
const sceneEl = document.querySelector('a-scene');

function updateStatus(msg) {
    statusEl.textContent = msg;
    console.log('[AR] ' + msg);
}

updateStatus('AR.js を読み込み中...');

sceneEl.addEventListener('camera-initialized', () => {
    updateStatus('✓ カメラ初期化完了 - Hiro マーカーを探索中...');
});

const markerEl = document.querySelector('a-marker');

if (markerEl) {
    markerEl.addEventListener('markerFound', () => {
        updateStatus('✓ Hiro マーカーを認識しました！');
    });

    markerEl.addEventListener('markerLost', () => {
        updateStatus('🔍 マーカーを見失いました - 再探索中...');
    });
}

window.addEventListener('error', (e) => {
    updateStatus('⚠ エラー: ' + e.message);
});
