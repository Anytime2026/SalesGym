import { Link, useParams } from 'react-router-dom'

export function EvaluationDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <section>
      <h1>評価詳細</h1>
      <p>評価ID: {id}</p>
      <p>
        <Link to="/evaluations">一覧に戻る</Link>
      </p>
    </section>
  )
}
