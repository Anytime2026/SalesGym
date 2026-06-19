import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { INDUSTRY_META } from '../types'
import type { Program, ProgramReview } from '../types'

export function OverallReviewPage() {
  const [searchParams] = useSearchParams()
  const [program, setProgram] = useState<Program | null>(null)
  const [review, setReview] = useState<ProgramReview | null>(null)

  useEffect(() => {
    const programId = searchParams.get('program_id') || localStorage.getItem('syodan_current_program_id')
    const saved = localStorage.getItem('syodan_programs')
    if (programId && saved) {
      try {
        const programs: Program[] = JSON.parse(saved)
        const current = programs.find(p => p.id === programId)
        if (current) {
          setProgram(current)
          
          const savedReview = localStorage.getItem(`syodan_program_review_${programId}`)
          if (savedReview) {
            setReview(JSON.parse(savedReview))
          }
        }
      } catch (e) {
        console.error("Failed to load program or review", e)
      }
    }
  }, [searchParams])

  if (!program) return <div className="card">読み込み中...</div>

  const meta = INDUSTRY_META[program.industry]

  return (
    <div className="card wide" style={{ maxWidth: '800px' }}>
      <h2>商談シリーズ完了・AI総評</h2>
      <p className="small">{meta.company} の {meta.personName} {meta.honorific} との商談シリーズ（全 {program.totalSessions} 回）が完了しました</p>

      {/* 真の課題の暴露 */}
      <div style={{ background: '#fff0f6', padding: 20, borderRadius: 12, margin: '20px 0', border: '1px solid #FF80AB' }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 10px 0', color: '#E91E63', fontSize: '15px' }}>🔑 ついに明かされる顧客の「真の課題」</p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: '1.6', color: '#333' }}>
          {review?.trueProblemRevealed || `実は、${meta.personName}氏は「社内に導入・活用をリードできるIT人材が一人もおらず、失敗したときの責任を一人で負うことになるため、導入後の現場の混乱と業務停止」を何よりも恐れていました。`}
        </p>
      </div>

      {/* AI総評 */}
      <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px solid #eee', marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid #E91E63', paddingBottom: '8px', color: '#E91E63' }}>🤖 AIによるシリーズ全体総評</h3>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#333', whiteSpace: 'pre-wrap' }}>
          {review?.overallComment || '全回を通じた商談お疲れ様でした。顧客の現状課題を丁寧に整理し、徐々に警戒を解いていく営業スタイルは非常に好印象でした。'}
        </div>
      </div>

      {/* 先輩への質問シート（商談全体用） */}
      <div style={{ background: '#f3e5f5', padding: 20, borderRadius: 12, border: '1px solid #d1c4e9', marginBottom: 25 }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid #7b1fa2', paddingBottom: '8px', color: '#7b1fa2' }}>📝 先輩への質問シート (商談全体用)</h3>
        <p className="small" style={{ color: '#4a148c', marginTop: '-5px', marginBottom: '15px' }}>
          商談シリーズを振り返り、次回のアクションに向けて先輩にアドバイスをもらうための質問シートです。
        </p>
        
        {review?.overallQuestions && review.overallQuestions.length > 0 ? (
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            {review.overallQuestions.map((q, idx) => (
              <li key={idx} style={{ fontSize: '13.5px', color: '#333', marginBottom: '10px', lineHeight: '1.5' }}>
                <b>質問 {idx + 1}:</b> {q}
              </li>
            ))}
          </ul>
        ) : (
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li style={{ fontSize: '13.5px', color: '#333', marginBottom: '10px', lineHeight: '1.5' }}>
              <b>質問 1:</b> 初回からクロージングまでの全体の流れにおいて、顧客の「ITへの苦手意識」を払拭するタイミングや事例紹介の出し方は適切でしたか？
            </li>
            <li style={{ fontSize: '13.5px', color: '#333', marginBottom: '10px', lineHeight: '1.5' }}>
              <b>質問 2:</b> 相手の真の課題である「導入後のサポート体制への不安」を解消するために、次に持参するべき運用提案書のポイントについてアドバイスをいただけますか？
            </li>
          </ul>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <Link to="/evaluations" className="btn secondary" style={{ flex: 1, margin: 0 }}>📊 評価履歴へ戻る</Link>
        <Link to="/" className="btn primary" style={{ flex: 1, margin: 0 }}>🏠 トップに戻る</Link>
      </div>
    </div>
  )
}
