import type { ReactNode } from 'react'
import './Layout.css'

type StandalonePageLayoutProps = {
  children: ReactNode
}

export function StandalonePageLayout({ children }: StandalonePageLayoutProps) {
  return (
    <div className="layout">
      <main className="layout__main">{children}</main>
    </div>
  )
}
