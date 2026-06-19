import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { INDUSTRY_META } from '../types'
import type { Program } from '../types'

export function EvaluationsPage() {
  const navigate = useNavigate()
  const [sessionResults, setSessionResults] = useState<any[]>([])

  useEffect(() => {
    const results: any[] = []
    
    // 1. Load individual session results
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('syodan_session_result_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!)
          results.push({
            type: 'session',
            id: data.id,
            programId: data.programId,
            industry: data.industry,
            sessionNumber: data.sessionNumber,
            createdAt: data.createdAt
          })
        } catch (e) {
          console.error("Failed to parse session result", e)
        }
      }
    }

    // 2. Load completed program overall reviews
    const savedPrograms = localStorage.getItem('syodan_programs')
    if (savedPrograms) {
      try {
        const programs: Program[] = JSON.parse(savedPrograms)
        programs.forEach(prog => {
          const reviewKey = `syodan_program_review_${prog.id}`
          const reviewSaved = localStorage.getItem(reviewKey)
          if (reviewSaved) {
            try {
              const reviewData = JSON.parse(reviewSaved)
              results.push({
                type: 'overall',
                id: prog.id,
                programId: prog.id,
                industry: prog.industry,
                createdAt: reviewData.createdAt || prog.createdAt,
                totalSessions: prog.totalSessions
              })
            } catch (e) {
              console.error("Failed to parse program review", e)
            }
          }
        })
      } catch (e) {
        console.error("Failed to parse programs list", e)
      }
    }

    // Sort by newest first
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setSessionResults(results)
  }, [])

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  return (
    <div className="card wide" style={{ maxWidth: '800px' }}>
      <h2>商談評価履歴</h2>
      <p className="small" style={{ marginBottom: '20px' }}>これまでの個別セッションおよびシリーズ総評一覧</p>

      {sessionResults.length === 0 ? (
        <p className="small">完了したセッションや商談はまだありません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessionResults.map(res => {
            const industryLabel = res.industry ? INDUSTRY_META[res.industry as keyof typeof INDUSTRY_META]?.label : '不明な業界';
            const sessionText = res.sessionNumber ? `第${res.sessionNumber}回商談` : `セッション #${res.id?.split('_')[1]?.slice(-4)}`;
            
            const isOverall = res.type === 'overall'

            return (
              <Link 
                key={res.id} 
                to={isOverall ? `/overall-review?program_id=${res.programId}` : `/evaluations/${res.id}`} 
                className="msg ai" 
                style={{ 
                  textDecoration: 'none', 
                  display: 'block', 
                  border: isOverall ? '2px solid #E91E63' : '1px solid #eee', 
                  background: isOverall ? '#fff0f6' : '#fff',
                  width: '100%', 
                  margin: 0,
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: isOverall ? '#E91E63' : '#1C75BC', fontSize: '15px' }}>
                    {isOverall ? `🏆 ${industryLabel} - 商談シリーズ完了 (総評)` : `${industryLabel} - ${sessionText}`}
                  </p>
                  {isOverall && (
                    <span style={{ 
                      background: '#E91E63', 
                      color: '#fff', 
                      fontSize: '10px', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontWeight: 'bold' 
                    }}>シリーズ完了</span>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <p className="small" style={{ margin: 0, opacity: 0.8 }}>
                    {isOverall ? `全${res.totalSessions}回のアプローチ評価` : `実施日: ${formatDate(res.createdAt)}`}
                  </p>
                  <p className="small" style={{ margin: 0, fontWeight: 'bold', color: isOverall ? '#E91E63' : '#1C75BC' }}>
                    {isOverall ? '全体総評を見る ＞' : '詳細評価 ＞'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <button className="btn secondary" onClick={() => navigate('/')} style={{ marginTop: '24px' }}>ホームに戻る</button>
    </div>
  )
}
