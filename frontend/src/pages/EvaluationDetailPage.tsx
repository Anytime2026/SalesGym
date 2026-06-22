import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getProgram, getSession } from '../lib/api'
import { findRegistryEntry } from '../lib/registry'
import type { HearingSession, Program } from '../lib/types'
import { INDUSTRY_META } from '../types'

export function EvaluationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<HearingSession | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getSession(id)
      .then((s) => {
        setSession(s)
        return getProgram(s.program_id)
      })
      .then(setProgram)
      .catch(() => setError('評価データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="card">読み込み中…</div>
  if (error || !session || !program) return <div className="card">{error ?? 'データがありません'}</div>

  const entry = findRegistryEntry(program.id)
  const industryLabel = entry ? INDUSTRY_META[entry.industry]?.label : program.field
  const sessionSummary = program.customer_state?.session_summaries?.find(
    (s) => s.session_number === session.session_number,
  )?.summary

  return (
    <div className="card wide" style={{ maxWidth: '800px' }}>
      <h2>商談評価詳細</h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '15px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px',
        }}
      >
        <div>
          <span style={{ fontWeight: 'bold', color: '#E91E63' }}>
            {industryLabel} - 第 {session.session_number} 回商談
          </span>
        </div>
        <div className="small">
          {session.ended_at
            ? `実施日: ${new Date(session.ended_at).toLocaleDateString()}`
            : session.title}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 'bold', fontSize: '15px', color: '#E91E63', marginBottom: '10px' }}>
          💬 会話履歴
        </p>
        <div
          style={{
            background: '#fafafa',
            padding: '15px',
            borderRadius: '12px',
            border: '1px solid #eee',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {session.transcript ? (
            session.transcript.split('\n').map((line, idx) => {
              const isUser = line.startsWith('営業:')
              const sender = isUser ? 'あなた' : 'AI顧客'
              const content = line.replace(/^(営業:|顧客:)\s*/, '').trim()
              if (!content) return null

              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: isUser ? '#E91E63' : '#fff',
                    color: isUser ? '#fff' : '#333',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    borderBottomRightRadius: isUser ? '2px' : '12px',
                    borderBottomLeftRadius: isUser ? '12px' : '2px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    border: isUser ? 'none' : '1px solid #eee',
                    fontSize: '13.5px',
                    lineHeight: '1.4',
                  }}
                >
                  <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'bold', marginBottom: '3px' }}>
                    {sender}
                  </div>
                  {content}
                </div>
              )
            })
          ) : (
            <p className="small" style={{ margin: 0, textAlign: 'center' }}>
              会話履歴がありません（処理中の場合はしばらくお待ちください）
            </p>
          )}
        </div>
      </div>

      {sessionSummary && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: 15, marginBottom: 20 }}>
          <h3
            style={{
              marginTop: 0,
              color: '#E91E63',
              borderBottom: '2px solid #E91E63',
              paddingBottom: '8px',
            }}
          >
            📋 セッション要約
          </h3>
          <div
            className="msg ai"
            style={{
              background: '#fff0f6',
              border: '1px solid #FF80AB',
              width: '100%',
              margin: 0,
              padding: 15,
              borderRadius: 12,
            }}
          >
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', color: '#333' }}>{sessionSummary}</p>
          </div>
        </div>
      )}

      <div style={{ background: '#f3e5f5', padding: 20, borderRadius: 12, border: '1px solid #d1c4e9', marginBottom: 25 }}>
        <h3
          style={{
            marginTop: 0,
            borderBottom: '2px solid #7b1fa2',
            paddingBottom: '8px',
            color: '#7b1fa2',
          }}
        >
          📝 先輩からの評価
        </h3>
        {session.evaluations && session.evaluations.length > 0 ? (
          session.evaluations.map((ev) => (
            <div
              key={ev.id}
              style={{
                background: '#fff',
                padding: 14,
                borderRadius: 10,
                marginBottom: 10,
                border: '1px solid #e1bee7',
              }}
            >
              <p className="small" style={{ margin: '0 0 6px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {ev.evaluator_id}
              </p>
              <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {ev.content || '（評価内容なし）'}
              </p>
            </div>
          ))
        ) : (
          <p className="small" style={{ margin: 0, color: '#4a148c' }}>
            先輩評価はまだ届いていません。HULFT 経由で反映されるまでお待ちください。
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to="/evaluations" className="btn secondary" style={{ flex: 1, margin: 0 }}>
          一覧に戻る
        </Link>
        <Link to="/" className="btn primary" style={{ flex: 1, margin: 0 }}>
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
