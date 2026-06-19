import { useCallback, useEffect, useRef, useState } from 'react'

import { getWsUrl } from '../lib/api'
import type { TranscriptMessage, WsServerMessage } from '../lib/types'

type UseHearingWebSocketOptions = {
  sessionId: string
  enabled: boolean
  onSessionEnded?: (reason: string) => void
}

export function useHearingWebSocket({
  sessionId,
  enabled,
  onSessionEnded,
}: UseHearingWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const audioQueueRef = useRef<Blob[]>([])
  const playingRef = useRef(false)

  const playNext = useCallback(async () => {
    if (playingRef.current) return
    const next = audioQueueRef.current.shift()
    if (!next) {
      setAiSpeaking(false)
      return
    }
    playingRef.current = true
    setAiSpeaking(true)
    const url = URL.createObjectURL(next)
    const audio = new Audio(url)
    audio.onended = () => {
      URL.revokeObjectURL(url)
      playingRef.current = false
      playNext()
    }
    await audio.play().catch(() => {
      playingRef.current = false
      setAiSpeaking(false)
    })
  }, [])

  useEffect(() => {
    if (!enabled || !sessionId) return

    const ws = new WebSocket(getWsUrl(sessionId))
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {
      // #region agent log
      fetch('http://127.0.0.1:7710/ingest/8f9dd29b-f72f-45b0-934b-d4c329cf521d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4c07bd'},body:JSON.stringify({sessionId:'4c07bd',location:'useHearingWebSocket.ts:onopen',message:'websocket connected',data:{sessionId},timestamp:Date.now(),hypothesisId:'C',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      setConnected(true)
    }
    ws.onclose = () => setConnected(false)
    ws.onmessage = async (event) => {
      if (event.data instanceof ArrayBuffer) {
        audioQueueRef.current.push(new Blob([event.data], { type: 'audio/mpeg' }))
        playNext()
        return
      }
      const msg = JSON.parse(event.data as string) as WsServerMessage
      if (msg.type === 'transcript') {
        setTranscripts((prev) => [...prev, { speaker: msg.speaker, text: msg.text }])
        if (msg.speaker === 'user') setProcessing(true)
        if (msg.speaker === 'ai') setProcessing(false)
      }
      if (msg.type === 'turn_complete') setProcessing(false)
      if (msg.type === 'session_ended') onSessionEnded?.(msg.reason)
      if (msg.type === 'error') {
        // #region agent log
        fetch('http://127.0.0.1:7710/ingest/8f9dd29b-f72f-45b0-934b-d4c329cf521d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4c07bd'},body:JSON.stringify({sessionId:'4c07bd',location:'useHearingWebSocket.ts:onmessage:error',message:'server error',data:{errorMessage:msg.message},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
        // #endregion
        setLastError(msg.message)
        setProcessing(false)
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [enabled, sessionId, onSessionEnded, playNext])

  const sendJson = useCallback((data: object) => {
    wsRef.current?.send(JSON.stringify(data))
  }, [])

  const sendAudioChunk = useCallback((chunk: Blob): Promise<void> => {
    return chunk.arrayBuffer().then((buf) => {
      const ws = wsRef.current
      // #region agent log
      fetch('http://127.0.0.1:7710/ingest/8f9dd29b-f72f-45b0-934b-d4c329cf521d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4c07bd'},body:JSON.stringify({sessionId:'4c07bd',location:'useHearingWebSocket.ts:sendAudioChunk',message:'audio chunk sending',data:{byteLength:buf.byteLength,wsOpen:ws?.readyState===WebSocket.OPEN},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(buf)
      }
    })
  }, [])

  const pttStart = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7710/ingest/8f9dd29b-f72f-45b0-934b-d4c329cf521d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4c07bd'},body:JSON.stringify({sessionId:'4c07bd',location:'useHearingWebSocket.ts:pttStart',message:'ptt_start sent',data:{},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    sendJson({ type: 'ptt_start' })
  }, [sendJson])

  const pttEnd = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7710/ingest/8f9dd29b-f72f-45b0-934b-d4c329cf521d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4c07bd'},body:JSON.stringify({sessionId:'4c07bd',location:'useHearingWebSocket.ts:pttEnd',message:'ptt_end sent',data:{},timestamp:Date.now(),hypothesisId:'A',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    sendJson({ type: 'ptt_end', media_format: 'webm' })
    setProcessing(true)
  }, [sendJson])
  const ping = useCallback(() => sendJson({ type: 'ping' }), [sendJson])

  return {
    connected,
    processing,
    aiSpeaking,
    transcripts,
    lastError,
    pttStart,
    pttEnd,
    sendAudioChunk,
    ping,
  }
}
