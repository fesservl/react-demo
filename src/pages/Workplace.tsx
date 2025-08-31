import { useState } from 'react'
import styles from './Workplace.module.scss'

type Task = {
  id: number
  title: string
  completed: boolean
}

export const Workplace = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Изучить React Router', completed: false },
    { id: 2, title: 'Настроить рабочее место', completed: false },
  ])

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  return (
    <div className={styles.workplace}>
      <h1>Рабочее место</h1>
      
      <div className={styles.taskList}>
        {tasks.map(task => (
          <div
            key={task.id}
            className={`${styles.task} ${task.completed ? styles.completed : ''}`}
            onClick={() => toggleTask(task.id)}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span>{task.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}