import { useEffect, useRef, useState } from 'react'

export function useSessionTimer(
  startedAt: string | null,
  limitMinutes: number,
) {
  const [remainingSec, setRemainingSec] = useState(limitMinutes * 60)
  const [overtimeSec, setOvertimeSec] = useState(0)

  useEffect(() => {
    if (!startedAt) {
      setRemainingSec(limitMinutes * 60)
      setOvertimeSec(0)
      return
    }
    const start = new Date(startedAt).getTime()
    const total = limitMinutes * 60

    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      if (elapsed <= total) {
        setRemainingSec(total - elapsed)
        setOvertimeSec(0)
      } else {
        setRemainingSec(0)
        setOvertimeSec(elapsed - total)
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [startedAt, limitMinutes])

  const overtime = overtimeSec > 0
  const displaySec = overtime ? overtimeSec : remainingSec
  const minutes = Math.floor(displaySec / 60)
  const seconds = displaySec % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const label = overtime ? `+${timeStr}` : timeStr
  const warning = overtime || (remainingSec <= 300 && remainingSec > 0)

  return { remainingSec, overtimeSec, label, warning, overtime }
}

export function usePingInterval(sendPing: () => void, intervalMs = 5000) {
  const sendRef = useRef(sendPing)
  sendRef.current = sendPing

  useEffect(() => {
    const id = window.setInterval(() => sendRef.current(), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
}
