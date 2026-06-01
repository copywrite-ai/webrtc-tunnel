const video = document.getElementById('video')
const urlInput = document.getElementById('url')
const statusEl = document.getElementById('status')
const playBtn = document.getElementById('play')
let player = null

function setStatus(text) {
  statusEl.textContent = '状态: ' + text
}

function stop() {
  if (player && typeof player.close === 'function') player.close()
  player = null
}

function start() {
  stop()
  if (!window.ZLMRTCClient) {
    setStatus('ZLMRTCClient.js 加载失败')
    return
  }
  setStatus('connecting...')
  player = new window.ZLMRTCClient.Endpoint({
    element: video,
    zlmsdpUrl: urlInput.value.trim(),
    debug: false,
    audioEnable: true,
    videoEnable: true,
    recvOnly: true,
  })

  player.on(window.ZLMRTCClient.Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, (state) => {
    setStatus(state)
  })

  player.on(window.ZLMRTCClient.Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, () => {
    setStatus('SDP exchange failed (检查 CORS / Tailnet 连通性)')
  })
}

playBtn.addEventListener('click', start)
