import { Link } from 'react-router-dom'

export function EvaluationsPage() {
  return (
    <section>
      <h1>評価一覧</h1>
      <p>過去のロープレ評価を確認できます。</p>
      <ul>
        <li>
          <Link to="/evaluations/sample">評価サンプル（詳細）</Link>
        </li>
      </ul>
    </section>
  )
}
