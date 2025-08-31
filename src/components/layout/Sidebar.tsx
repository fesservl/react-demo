import styles from './Sidebar.module.scss'
import type { FC } from 'react'
import { Navigation } from './Navigation'

type SidebarProps = {
  isOpen: boolean
}

export const Sidebar: FC<SidebarProps> = ({ isOpen }) => (
  <aside className={isOpen ? styles.sidebar : styles.sidebarClosed}>
    <div className={styles.logo}>
      <h2>Workspace</h2>
    </div>
    <Navigation />
  </aside>
)