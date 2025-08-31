import type { ReactNode } from 'react'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import styles from './Layout.module.scss'

type LayoutProps = {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div
      className={styles.layout}
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <Sidebar isOpen={isSidebarOpen} />
      <div
        className={styles.sidebarHandle}
        onClick={() => setSidebarOpen(v => !v)}
        tabIndex={0}
        aria-label={isSidebarOpen ? 'Скрыть сайдбар' : 'Показать сайдбар'}
        role="button"
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSidebarOpen(v => !v)}
        data-closed={!isSidebarOpen}
      />
      <MainContent>{children}</MainContent>
    </div>
  )
}