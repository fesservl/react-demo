import styles from './Home.module.scss'

export const Home = () => {
  return (
    <div className={styles.home}>
      <h1>Добро пожаловать в Workspace</h1>
      <p>Выберите раздел в меню слева для начала работы</p>
      
      <div className={styles.features}>
        <div className={styles.feature}>
          <h3>Рабочее место</h3>
          <p>Настройте своё рабочее пространство</p>
        </div>
        <div className={styles.feature}>
          <h3>Настройки</h3>
          <p>Персонализируйте приложение под себя</p>
        </div>
      </div>
    </div>
  )
}