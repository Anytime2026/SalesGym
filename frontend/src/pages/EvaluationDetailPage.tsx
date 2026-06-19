import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { INDUSTRY_META } from '../types'

export function EvaluationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const saved = localStorage.getItem(`syodan_session_result_${id}`)
    if (saved) {
      setSession(JSON.parse(saved))
    }
  }, [id])

  if (!session) return <div className="card">読み込み中...</div>

  const aiEval = session.aiEvaluation || {
    score: '評価中',
    comment: '評価データを取得できませんでした。対話内容を見直してください。',
    questions: [
      '今回の相手の反応において、どこでITスキルの低さに気付くべきでしたか？',
      '課題を深掘りするために、どのような質問の切り口が効果的だったでしょうか？',
      '次回に向けて、どのような準備をしておくべきかアドバイスをいただけますか？'
    ]
  }

  return (
    <div className="card wide" style={{ maxWidth: '800px' }}>
      <h2>商談評価詳細</h2>
      
      {/* 基本情報 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <div>
          <span style={{ fontWeight: 'bold', color: '#E91E63' }}>
            {session.industry ? INDUSTRY_META[session.industry as keyof typeof INDUSTRY_META]?.label : ''} - 第 {session.sessionNumber} 回商談
          </span>
        </div>
        <div className="small">
          実施日: {new Date(session.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 'bold', fontSize: '15px', color: '#E91E63', marginBottom: '10px' }}>💬 会話履歴</p>
        <div style={{ 
          background: '#fafafa', 
          padding: '15px', 
          borderRadius: '12px', 
          border: '1px solid #eee',
          maxHeight: '260px', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {session.transcript ? (
            session.transcript.split('\n').map((line: string, idx: number) => {
              const isUser = line.startsWith('自分:') || line.startsWith('user:') || line.startsWith('自分: ')
              const sender = isUser ? 'あなた' : 'AI顧客'
              const content = line.replace(/^(自分:|相手:|user:|assistant:|自分: |相手: )/, '').trim()
              
              if (!content) return null;

              return (
                <div key={idx} style={{ 
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
                  lineHeight: '1.4'
                }}>
                  <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'bold', marginBottom: '3px' }}>
                    {sender}
                  </div>
                  {content}
                </div>
              )
            })
          ) : (
            <p className="small" style={{ margin: 0, textAlign: 'center' }}>会話履歴がありません</p>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eee', paddingTop: 15, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, color: '#E91E63', borderBottom: '2px solid #E91E63', paddingBottom: '8px' }}>🤖 AIによる商談評価</h3>
        
        <div className="msg ai" style={{ background: '#fff0f6', border: '1px solid #FF80AB', width: '100%', margin: 0, padding: 15, borderRadius: 12 }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold', color: '#E91E63' }}>
            分析スコア: {aiEval.score}
          </p>
          <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', color: '#333' }}>
            {aiEval.comment}
          </p>
        </div>
      </div>

      {/* 先輩への質問シート */}
      <div style={{ background: '#f3e5f5', padding: 20, borderRadius: 12, border: '1px solid #d1c4e9', marginBottom: 25 }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid #7b1fa2', paddingBottom: '8px', color: '#7b1fa2' }}>📝 先輩への質問シート</h3>
        <p className="small" style={{ color: '#4a148c', marginTop: '-5px', marginBottom: '15px' }}>
          この回の対話内容を踏まえ、ロープレを良くするために先輩へアドバイスを求めるための質問リストです。
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          {aiEval.questions.map((q: string, idx: number) => (
            <li key={idx} style={{ fontSize: '13.5px', color: '#333', marginBottom: '10px', lineHeight: '1.5' }}>
              <b>質問 {idx + 1}:</b> {q}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to="/evaluations" className="btn secondary" style={{ flex: 1, margin: 0 }}>一覧に戻る</Link>
        <Link to="/" className="btn primary" style={{ flex: 1, margin: 0 }}>ホームに戻る</Link>
      </div>
    </div>
  )
}
