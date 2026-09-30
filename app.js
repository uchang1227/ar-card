const status = document.getElementById('status');

function updateStatus(message) {
  status.textContent = message;
}

const scene = document.getElementById('scene');

scene.addEventListener('loaded', () => {
  updateStatus('読み込み完了。マーカーを探しています...');
});

const marker = document.querySelector('a-marker');

if (marker) {
  marker.addEventListener('markerFound', () => {
    updateStatus('マーカーを認識しました');
  });

  marker.addEventListener('markerLost', () => {
    updateStatus('マーカーを見失いました');
  });
}

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(() => {
    updateStatus('カメラを起動しました');
  })
  .catch(() => {
    updateStatus('カメラの許可が必要です');
  });
