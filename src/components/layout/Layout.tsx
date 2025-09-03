import type { ReactNode } from 'react'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import styles from './Layout.module.scss'

type LayoutProps = {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {

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
      <MainContent>{children}</MainContent>
    </div>
  )
}