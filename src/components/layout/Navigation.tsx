import { NavLink } from 'react-router-dom'
import styles from './Navigation.module.scss'

export const Navigation = () => {
  const menuItems = [
    { path: '/', label: 'Главная' },
    { path: '/workplace', label: 'Рабочее место' },
    { path: '/settings', label: 'Настройки' },
  ]

  return (
    <nav className={styles.navigation}>
      {menuItems.map(({ path, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ''}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}