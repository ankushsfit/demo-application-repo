import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { formatDueDate, normalizeDueDate, normalizePriority, validateTaskText } from './todoUtils'

const STORAGE_KEY = 'frontend-todo-app-items'
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function App() {
  const [tasks, setTasks] = useState(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [draft, setDraft] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState({ type: '', message: '' })
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingPriority, setEditingPriority] = useState('medium')
  const [editingDueDate, setEditingDueDate] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    }
  }, [tasks])

  useEffect(() => {
    if (!notice.message) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setNotice({ type: '', message: '' })
    }, 2400)

    return () => window.clearTimeout(timer)
  }, [notice.message])

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.done).length

    return {
      total: tasks.length,
      completed,
      remaining: tasks.length - completed,
      upcoming: tasks.filter((task) => !task.done && task.dueDate).length,
    }
  }, [tasks])

  const visibleTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    let filtered = tasks.filter((task) => {
      if (filter === 'active') {
        return !task.done
      }

      if (filter === 'completed') {
        return task.done
      }

      return true
    })

    if (normalizedQuery) {
      filtered = filtered.filter((task) => {
        const haystack = `${task.text} ${task.priority || 'medium'} ${task.dueDate}`.toLowerCase()
        return haystack.includes(normalizedQuery)
      })
    }

    return [...filtered].sort((first, second) => {
      const firstPriority = PRIORITY_ORDER[first.priority] ?? PRIORITY_ORDER.medium
      const secondPriority = PRIORITY_ORDER[second.priority] ?? PRIORITY_ORDER.medium

      if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority
      }

      if (!first.dueDate && !second.dueDate) {
        return 0
      }

      if (!first.dueDate) {
        return 1
      }

      if (!second.dueDate) {
        return -1
      }

      return first.dueDate.localeCompare(second.dueDate)
    })
  }, [filter, searchQuery, tasks])

  const addTask = (event) => {
    event.preventDefault()

    const result = validateTaskText(draft, tasks)
    if (typeof result === 'string') {
      setError(result)
      setNotice({ type: 'error', message: result })
      return
    }

    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    setTasks((current) => [
      ...current,
      {
        id,
        text: result.text,
        done: false,
        priority: normalizePriority(priority),
        dueDate: normalizeDueDate(dueDate),
      },
    ])
    setDraft('')
    setPriority('medium')
    setDueDate('')
    setError('')
    setNotice({ type: 'success', message: 'Task created successfully.' })
  }

  const toggleTask = (id) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    )
  }

  const deleteTask = (id) => {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  const clearCompleted = () => {
    setTasks((current) => current.filter((task) => !task.done))
  }

  const startEditing = (task) => {
    setEditingId(task.id)
    setEditingText(task.text)
    setEditingPriority(task.priority || 'medium')
    setEditingDueDate(task.dueDate || '')
    setError('')
  }

  const saveEdit = (id) => {
    const result = validateTaskText(editingText, tasks.filter((task) => task.id !== id))
    if (typeof result === 'string') {
      setError(result)
      return
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              text: result.text,
              priority: normalizePriority(editingPriority),
              dueDate: normalizeDueDate(editingDueDate),
            }
          : task,
      ),
    )
    setEditingId(null)
    setEditingText('')
    setEditingPriority('medium')
    setEditingDueDate('')
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
    setEditingPriority('medium')
    setEditingDueDate('')
    setError('')
  }

  const markAllDone = () => {
    const hasActiveTasks = tasks.some((task) => !task.done)
    if (!hasActiveTasks) {
      setTasks((current) => current.map((task) => ({ ...task, done: false })))
      return
    }

    setTasks((current) => current.map((task) => ({ ...task, done: true })))
  }

  return (
    <main className="app-shell">
      <section className="todo-card" aria-label="Todo app">
        <div className="todo-header">
          <div>
            <p className="eyebrow">Todo</p>
            <h1>Stay on top of your day always</h1>
          </div>
          <div className="todo-pill">{stats.total} tasks</div>
        </div>

        <form className="todo-form" onSubmit={addTask}>
          {notice.message ? (
            <div className={`todo-toast ${notice.type}`} role="status" aria-live="polite">
              {notice.message}
            </div>
          ) : null}
          <div className="todo-input-stack">
            <input
              type="text"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                if (error) {
                  setError('')
                }
                if (notice.message) {
                  setNotice({ type: '', message: '' })
                }
              }}
              placeholder="Add a new task"
              aria-label="New task"
            />
            <div className="todo-meta-fields">
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
          </div>
          <button type="submit">Add</button>
        </form>

        {error ? <p className="todo-error">{error}</p> : null}

        <div className="todo-toolbar">
          <div className="todo-stats">
            <span>{stats.remaining} active</span>
            <span>{stats.completed} done</span>
            <span>{stats.upcoming} with dates</span>
          </div>

          <input
            type="search"
            className="todo-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
          />

          <div className="todo-filters" role="tablist" aria-label="Todo filters">
            <button
              type="button"
              className={filter === 'all' ? 'filter-pill active' : 'filter-pill'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={filter === 'active' ? 'filter-pill active' : 'filter-pill'}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={filter === 'completed' ? 'filter-pill active' : 'filter-pill'}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        <button type="button" className="mark-all-button" onClick={markAllDone}>
          {tasks.some((task) => !task.done) ? 'Mark all done' : 'Reset all'}
        </button>

        <ul className="todo-list">
          {visibleTasks.length === 0 ? (
            <li className="empty-state">
              {tasks.length === 0
                ? 'Your list is empty. Add a task to begin.'
                : 'No tasks match this filter right now.'}
            </li>
          ) : (
            visibleTasks.map((task) => (
              <li key={task.id} className={task.done ? 'todo-item is-complete' : 'todo-item'}>
                <label className="todo-item__main">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                  />
                  {editingId === task.id ? (
                    <div className="todo-edit-stack">
                      <input
                        type="text"
                        className="todo-edit-input"
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        autoFocus
                        aria-label="Edit task"
                      />
                      <div className="todo-meta-fields">
                        <select value={editingPriority} onChange={(event) => setEditingPriority(event.target.value)}>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <input
                          type="date"
                          value={editingDueDate}
                          onChange={(event) => setEditingDueDate(event.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="todo-text-block">
                      <span className="todo-text">{task.text}</span>
                      <div className="todo-meta-badges">
                        <span className={`priority-badge ${task.priority || 'medium'}`}>{task.priority || 'medium'}</span>
                        {task.dueDate ? <span className="due-badge">{formatDueDate(task.dueDate)}</span> : null}
                      </div>
                    </div>
                  )}
                </label>

                <div className="todo-actions">
                  {editingId === task.id ? (
                    <>
                      <button type="button" className="action-button save" onClick={() => saveEdit(task.id)}>
                        Save
                      </button>
                      <button type="button" className="action-button cancel" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="action-button" onClick={() => startEditing(task)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="todo-delete"
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Delete ${task.text}`}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        {tasks.some((task) => task.done) ? (
          <button type="button" className="clear-button" onClick={clearCompleted}>
            Clear completed
          </button>
        ) : null}
      </section>
    </main>
  )
}

export default App
