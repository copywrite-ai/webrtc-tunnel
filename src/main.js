const video = document.getElementById('video')
const urlInput = document.getElementById('url')
const statusEl = document.getElementById('status')
const playBtn = document.getElementById('play')
let player = null
let statsTimer = null

function setStatus(text) {
  statusEl.textContent = '状态: ' + text
}

function stop() {
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
  if (player && typeof player.close === 'function') player.close()
  player = null
}

function getPeerConnection(endpoint) {
  if (!endpoint) return null
  if (endpoint._pc) return endpoint._pc
  if (endpoint.peerConnection) return endpoint.peerConnection
  for (const key of Object.keys(endpoint)) {
    if (endpoint[key] instanceof RTCPeerConnection) return endpoint[key]
  }
  return null
}

async function detectTransport(endpoint) {
  const pc = getPeerConnection(endpoint)
  if (!pc) return null
  const stats = await pc.getStats()
  let selectedPair = null
  stats.forEach((report) => {
    if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated) {
      selectedPair = report
    }
  })
  if (!selectedPair) {
    stats.forEach((report) => {
      if (!selectedPair && report.type === 'candidate-pair' && report.state === 'succeeded') {
        selectedPair = report
      }
    })
  }
  if (!selectedPair) return null
  const local = stats.get(selectedPair.localCandidateId)
  const remote = stats.get(selectedPair.remoteCandidateId)
  const localType = (local && local.candidateType) || '-'
  const remoteType = (remote && remote.candidateType) || '-'
  const isRelay = localType === 'relay' || remoteType === 'relay'
  return {
    mode: isRelay ? 'RELAY' : 'P2P',
    localType,
    remoteType,
  }
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
    if (state === 'connected') {
      if (statsTimer) clearInterval(statsTimer)
      statsTimer = setInterval(async () => {
        try {
          const transport = await detectTransport(player)
          if (!transport) return
          setStatus(`connected | ${transport.mode} (${transport.localType} -> ${transport.remoteType})`)
        } catch (_err) {
        }
      }, 2000)
    }
  })

  player.on(window.ZLMRTCClient.Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, () => {
    setStatus('SDP exchange failed (检查 CORS / Tailnet 连通性)')
  })
}

playBtn.addEventListener('click', start)
